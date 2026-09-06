import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — DELT',
  alternates: {
    canonical: 'https://www.delt.website/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketingNav />

      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 pt-20 pb-24">
        <h1 className="text-4xl font-display font-semibold tracking-tight sm:text-5xl mb-4">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-12">Last Updated: September 6, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p>
            DELT ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our platform.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information that you voluntarily provide to us when you register on the platform, create a deal workspace, or contact us. This may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Information:</strong> Name, email address, and authentication credentials.</li>
            <li><strong>Financial Information:</strong> We do not store full credit card numbers. Payment processing is handled securely by third-party processors (e.g., Razorpay).</li>
            <li><strong>User Content:</strong> Files, chat messages, price proposals, and metadata uploaded to deal workspaces.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, operate, and maintain our platform.</li>
            <li>Facilitate transactions and deliver project files securely.</li>
            <li>Send transactional emails, OTPs, and notifications regarding your workspaces.</li>
            <li>Monitor and analyze usage and trends to improve user experience.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Security & Storage</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. Files uploaded to the platform are securely stored and only unlocked for clients upon successful payment verification.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Sharing Your Information</h2>
          <p>
            We do not sell your personal information. We may share information with:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> Third-party vendors that help us operate our business (e.g., Supabase for database hosting, Resend for email delivery, Razorpay for payments).</li>
            <li><strong>Other Users:</strong> To facilitate the transaction, relevant information (such as your name or email) is shared between the creator and the client within a specific deal workspace.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the right to access, correct, or delete your personal information. To exercise these rights, please contact us using the information below.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at [Contact Email Placeholder].
          </p>
          <p className="text-sm text-muted-foreground mt-8">
            [Legal Entity Placeholder], [Jurisdiction Placeholder]
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
