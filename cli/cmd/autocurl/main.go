package main

import (
	"errors"
	"fmt"
	"os"

	"github.com/anshumancodes/autocurl/internal/commands"
	"github.com/anshumancodes/autocurl/internal/interactive"
)

func main() {
	err := commands.Run(os.Args[1:], commands.Config{In: os.Stdin, Out: os.Stdout})
	if err == nil {
		return
	}
	exitCode := 1
	if len(os.Args) != 2 || errors.Is(err, interactive.ErrEOF) || errors.Is(err, interactive.ErrCancelled) {
		if len(os.Args) != 2 {
			exitCode = 2
		} else {
			exitCode = 130
		}
	}
	fmt.Fprintln(os.Stderr, err)
	os.Exit(exitCode)
}
