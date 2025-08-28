"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1C352D] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company Info */}
        <div>
          <h3 className="text-xl font-semibold mb-4">SkillConnect</h3>
          <p className="text-sm text-gray-300">
            Empowering your projects with trusted freelance talent worldwide.
            Connect, collaborate, and succeed with SkillConnect.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="text-sm text-gray-300 hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/services" className="text-sm text-gray-300 hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link href="/talent" className="text-sm text-gray-300 hover:text-white">
                Find Talent
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm text-gray-300 hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Support Links */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Support</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/help" className="text-sm text-gray-300 hover:text-white">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-sm text-gray-300 hover:text-white">
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-sm text-gray-300 hover:text-white">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-sm text-gray-300 hover:text-white">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
          <div className="flex space-x-4">
            <Link href="https://facebook.com" target="_blank" aria-label="Facebook">
              <Facebook className="h-6 w-6 text-gray-300 hover:text-white" />
            </Link>
            <Link href="https://twitter.com" target="_blank" aria-label="Twitter">
              <Twitter className="h-6 w-6 text-gray-300 hover:text-white" />
            </Link>
            <Link href="https://instagram.com" target="_blank" aria-label="Instagram">
              <Instagram className="h-6 w-6 text-gray-300 hover:text-white" />
            </Link>
            <Link href="https://linkedin.com" target="_blank" aria-label="LinkedIn">
              <Linkedin className="h-6 w-6 text-gray-300 hover:text-white" />
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
        <p>
          &copy; {new Date().getFullYear()} SkillConnect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}