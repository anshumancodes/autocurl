import type { Metadata } from "next";
import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";

export const metadata: Metadata = {
  title: "Real-World API Examples & Workflows - autocurl",
  description:
    "Explore realistic autocurl examples including Bearer token authentication, multipart form uploads, REST API CRUD operations, and JSON payloads.",
  alternates: {
    canonical: "/docs/examples",
  },
  openGraph: {
    title: "Real-World autocurl API Examples",
    description:
      "Code examples for common developer API workflows using autocurl and cURL.",
    url: "/docs/examples",
  },
};

export default function ExamplesPage() {
  return (
    <DocsLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: "Examples" },
      ]}
      currentSlug="/docs/examples"
    >
      <div className="space-y-8">
        <div>
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            Cookbook
          </div>
          <h1 className="font-extrabold text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.03em] text-bone">
            Real-World API Examples
          </h1>
          <p className="mt-3 text-mute text-[16px] sm:text-[17px] leading-relaxed max-w-[42em]">
            Practical examples covering authentications, multipart forms, query
            strings, and complex REST endpoints.
          </p>
        </div>

        {/* Example 1: Bearer Token Auth */}
        <section className="space-y-3 p-6 rounded-2xl border border-line bg-[#0e0c13]/70">
          <h2 className="text-[19px] font-bold text-bone">
            1. Bearer Token Authentication & JSON Payloads
          </h2>
          <p className="text-mute text-[14.5px] leading-relaxed">
            Sending a POST request with authentication tokens and a structured JSON
            body:
          </p>
          <div className="bg-[#15131b] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-bone overflow-x-auto">
            {`// requests.js
export default [
  {
    name: "Create Project",
    method: "POST",
    url: "https://api.acme.dev/v1/projects",
    headers: {
      "Authorization": "Bearer sk_test_51MzQ3w...",
      "Content-Type": "application/json"
    },
    body: {
      title: "New Marketing Campaign",
      visibility: "private",
      tags: ["marketing", "q4"]
    }
  }
];`}
          </div>
          <p className="text-[13.5px] text-mute">Compiled .acr output:</p>
          <div className="bg-[#15131b] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-sun overflow-x-auto">
            {`# Create Project
curl -X POST \\
  "https://api.acme.dev/v1/projects" \\
  -H "Authorization: Bearer sk_test_51MzQ3w..." \\
  -H "Content-Type: application/json" \\
  -d '{"title":"New Marketing Campaign","visibility":"private","tags":["marketing","q4"]}'`}
          </div>
        </section>

        {/* Example 2: Query Parameters & Filtering */}
        <section className="space-y-3 p-6 rounded-2xl border border-line bg-[#0e0c13]/70">
          <h2 className="text-[19px] font-bold text-bone">
            2. Paginated GET Requests with Query Parameters
          </h2>
          <p className="text-mute text-[14.5px] leading-relaxed">
            Fetching resources with search filters, page limits, and sort orders:
          </p>
          <div className="bg-[#15131b] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-bone overflow-x-auto">
            {`export default [
  {
    name: "Filter Active Subscriptions",
    method: "GET",
    url: "https://api.acme.dev/v1/subscriptions?status=active&limit=25&sort=desc",
    headers: {
      "Accept": "application/json"
    }
  }
];`}
          </div>
        </section>

        {/* Example 3: Multipart File Upload */}
        <section className="space-y-3 p-6 rounded-2xl border border-line bg-[#0e0c13]/70">
          <h2 className="text-[19px] font-bold text-bone">
            3. Multipart Form File Upload
          </h2>
          <p className="text-mute text-[14.5px] leading-relaxed">
            Uploading an avatar or document using cURL multipart form data (
            <code className="text-bone">-F</code>):
          </p>
          <div className="bg-[#15131b] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-bone overflow-x-auto">
            {`export default [
  {
    name: "Upload User Avatar",
    method: "POST",
    url: "https://api.acme.dev/v1/users/42/avatar",
    formData: {
      file: "@./assets/avatar.png",
      caption: "Profile Photo"
    }
  }
];`}
          </div>
          <p className="text-[13.5px] text-mute">Compiled .acr output:</p>
          <div className="bg-[#15131b] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-sun overflow-x-auto">
            {`# Upload User Avatar
curl -X POST \\
  "https://api.acme.dev/v1/users/42/avatar" \\
  -F "file=@./assets/avatar.png" \\
  -F "caption=Profile Photo"`}
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex justify-between items-center">
          <Link
            href="/docs/commands"
            className="text-[14px] text-mute hover:text-bone underline"
          >
            ← Command Reference
          </Link>
          <Link
            href="/curl-command-generator"
            className="text-[15px] font-bold text-sun hover:underline"
          >
            Curl Command Generator Guide →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
