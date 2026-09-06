import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Terms of Service — DELT',
  alternates: {
    canonical: 'https://www.delt.website/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketingNav />

      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 pt-20 pb-24">
        <h1 className="text-4xl font-display font-semibold tracking-tight sm:text-5xl mb-4">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-12">Last Updated: September 6, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p>
            Welcome to DELT. These Terms of Service ("Terms") govern your access to and use of the DELT platform, website, and services. By accessing or using our services, you agree to be bound by these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Our Role</h2>
          <p>
            DELT provides a platform that facilitates digital workspaces and file delivery between creators, freelancers, agencies, and their respective clients. We do not act as an employer, agency, or party to the contracts formed between creators and their clients. We simply provide the software tools to manage these transactions.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Account Registration</h2>
          <p>
            To use DELT as a creator, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to keep this information up to date. You are responsible for safeguarding the password that you use to access the service.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Payments & Deliverables</h2>
          <p>
            Payments processed through DELT are handled by third-party payment gateways (e.g., Razorpay). DELT is not responsible for the processing of these payments. Deliverable files are securely hosted and unlocked for the client only upon successful payment verification. Creators are solely responsible for the quality, accuracy, and legality of the files they upload.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Conduct</h2>
          <p>
            You agree not to use the service to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any local, state, national, or international law.</li>
            <li>Distribute malware, illegal content, or infringe upon the intellectual property rights of others.</li>
            <li>Engage in any activity that interferes with or disrupts the services.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Disclaimer of Warranties</h2>
          <p>
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. DELT makes no representations or warranties of any kind, express or implied, regarding the use or the results of this web site in terms of its correctness, accuracy, reliability, or otherwise.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at [Contact Email Placeholder].
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
