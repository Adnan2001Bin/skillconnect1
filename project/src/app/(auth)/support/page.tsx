"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";

export default function HelpAndSupportPage() {
  const { status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // FAQ data
  const faqs = [
    {
      question: "How do I create a new project?",
      answer:
        "To create a new project, navigate to the 'Projects' page and click 'Post a Project'. Fill in the required details such as title, description, budget, and timeline, then submit the form. Your project will be listed for talents to apply.",
    },
    {
      question: "How can I initiate a payment for a project?",
      answer:
        "Once a proposal is accepted, go to the project details page. If the payment status is 'pending', click 'Pay Now' to initiate the payment through our secure payment gateway.",
    },
    {
      question: "What should I do if I need a revision?",
      answer:
        "If you're not satisfied with the delivered work, request a revision from the project details page. Click 'Request Revision' and provide feedback. You have up to two revision attempts per project.",
    },
    {
      question: "How do I contact a talent?",
      answer:
        "Use the messaging system on the project details page to send direct messages to the talent assigned to your project.",
    },
    {
      question: "What are the payment statuses and their meanings?",
      answer:
        "Payment statuses include: 'Pending' (awaiting payment), 'Funded' (payment processed but project not completed), 'Completed' (payment finalized), and 'Failed' (payment issue occurred). Check these on the 'Your Payment Transactions' page.",
    },
  ];

  // Handle authentication state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1dbf73]"></div>
        <p className="ml-4 text-lg text-gray-800">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen font-sans py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white bg-[#1C352D] py-8 px-6 rounded-lg flex items-center gap-3 mb-12">
          <HelpCircle className="h-8 w-8 text-[#1dbf73]" />
          Help & Support
        </h1>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg bg-white">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full text-left p-4 font-medium text-gray-700 flex justify-between items-center hover:bg-gray-50"
                >
                  <span>{faq.question}</span>
                  <span>{openFAQ === index ? "−" : "+"}</span>
                </button>
                {openFAQ === index && (
                  <div className="p-4 pt-0 text-gray-600">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="bg-[#5E936C] text-white rounded-lg p-6 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-[#1dbf73]" />
            Contact Support
          </h2>
          <p className="mb-6">
            Can&apos;t find the answer you&apos;re looking for? Reach out to our
            support team, and we&apos;ll get back to you as soon as possible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Form */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white text-gray-700 placeholder-gray-500 border-gray-300 focus:border-[#1dbf73] focus:ring-[#1dbf73]"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-white text-gray-700 placeholder-gray-500 border-gray-300 focus:border-[#1dbf73] focus:ring-[#1dbf73]"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-1"
                >
                  Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  className="w-full min-h-[120px] bg-white text-gray-700 placeholder-gray-500 border-gray-300 focus:border-[#1dbf73] focus:ring-[#1dbf73]"
                />
              </div>
              <Button
                className="bg-[#1dbf73] text-white hover:bg-[#19a463] transition-colors"
                disabled={!name.trim() || !email.trim() || !message.trim()}
              >
                Send Message
              </Button>
            </div>
            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Get in Touch</h3>
                <p>
                  Our support team is available to assist you with any questions
                  or issues.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#1dbf73]" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href="mailto:support@skillconnect.com"
                      className="text-white hover:underline"
                    >
                      support@skillconnect.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#1dbf73]" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href="tel:+1234567890"
                      className="text-white hover:underline"
                    >
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="bg-green-100 rounded-3xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              className="bg-transparent border border-[#1dbf73] text-[#1dbf73] hover:bg-[#1dbf73] hover:text-white transition-colors"
              onClick={() => router.push("/docs/user-guide")}
            >
              User Guide
            </Button>
            <Button
              className="bg-transparent border border-[#1dbf73] text-[#1dbf73] hover:bg-[#1dbf73] hover:text-white transition-colors"
              onClick={() => router.push("/docs/faq")}
            >
              More FAQs
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
