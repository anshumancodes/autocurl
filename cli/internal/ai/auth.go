package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const defaultAuthorizeURL = "https://autocurl.lol/cli/authorize"

func tokenPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "autocurl", "credentials.json"), nil
}

func LoadToken() string {
	if value := strings.TrimSpace(os.Getenv("AUTOCURL_API_TOKEN")); value != "" {
		return value
	}
	path, err := tokenPath()
	if err != nil {
		return ""
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	var saved struct {
		Token string `json:"token"`
	}
	if json.Unmarshal(data, &saved) != nil {
		return ""
	}
	return strings.TrimSpace(saved.Token)
}

func saveToken(value string) error {
	path, err := tokenPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	data, _ := json.Marshal(struct {
		Token string `json:"token"`
	}{value})
	return os.WriteFile(path, data, 0o600)
}

func Login(ctx context.Context, out io.Writer) error {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("start login callback: %w", err)
	}
	defer listener.Close()
	state := fmt.Sprintf("%d", time.Now().UnixNano())
	redirect := "http://" + listener.Addr().String() + "/callback"
	authorize := strings.TrimRight(os.Getenv("AUTOCURL_AUTH_URL"), "/")
	if authorize == "" {
		authorize = defaultAuthorizeURL
	}
	query := url.Values{"state": {state}, "redirect_uri": {redirect}}
	loginURL := authorize + "?" + query.Encode()
	result := make(chan error, 1)
	go func() {
		server := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/callback" {
				http.NotFound(w, r)
				return
			}
			if r.URL.Query().Get("state") != state {
				result <- errors.New("login state mismatch")
				return
			}
			code := strings.TrimSpace(r.URL.Query().Get("code"))
			if code == "" {
				result <- errors.New("login was cancelled")
				return
			}
			_, _ = io.WriteString(w, "<html><body><p>autocurl is connected. You can close this window.</p></body></html>")
			if err := saveToken(code); err != nil {
				result <- fmt.Errorf("save credentials: %w", err)
				return
			}
			result <- nil
		})}
		go func() { <-ctx.Done(); _ = server.Shutdown(context.Background()) }()
		if err := server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			result <- err
		}
	}()
	if err := openBrowser(loginURL); err != nil {
		return err
	}
	fmt.Fprintf(out, "Opening browser for autocurl login…\n")
	select {
	case err := <-result:
		return err
	case <-time.After(5 * time.Minute):
		return errors.New("login timed out")
	}
}

func Logout(ctx context.Context, baseURL string) error {
	token := LoadToken()
	if token == "" {
		return nil
	}
	path, _ := tokenPath()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(baseURL, "/")+"/api/cli/revoke", nil)
	if err != nil {
		_ = os.Remove(path)
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil {
		_ = os.Remove(path)
		return err
	}
	resp.Body.Close()
	_ = os.Remove(path)
	return nil
}

func openBrowser(target string) error {
	var command string
	var args []string
	switch runtime.GOOS {
	case "darwin":
		command, args = "open", []string{target}
	case "windows":
		command, args = "rundll32", []string{"url.dll,FileProtocolHandler", target}
	default:
		command, args = "xdg-open", []string{target}
	}
	if err := exec.Command(command, args...).Start(); err != nil {
		return fmt.Errorf("open browser: %w (visit %s)", err, target)
	}
	return nil
}
