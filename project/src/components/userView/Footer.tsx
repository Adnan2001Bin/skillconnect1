"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from "lucide-react"; // Added Mail and Phone for contact info
import Image from "next/image";
import { Images } from "@/lib/images";

export default function Footer() {
  return (
    <footer className="bg-[#1C352D] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-8">
        {/* Logo and About Section */}
        <div className="lg:col-span-2 flex flex-col items-start">
          {/* Replace with your actual SkillConnect Logo Component or Image */}
          <div className="mb-4">
            <div className="flex-shrink-0">
            <Link href="/home">
              <Image
                src={Images.logoUser}
                alt="Logo"
                width={100}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
          </div>
          </div>
          <p className="text-sm text-emerald-100 leading-relaxed max-w-md">
            SkillConnect is your premier platform to discover and collaborate with top-tier freelance talent worldwide. Innovate, connect, and achieve your project goals with us.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-5 text-emerald-50">Quick Links</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/home" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                Home
              </Link>
            </li>
            <li>
              <Link href="/talentList" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                Browse Talent
              </Link>
            </li>
            <li>
              <Link href="/projects" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                Browse Projects
              </Link>
            </li>
            <li>
              <Link href="/post-project" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                Post a Project
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold mb-5 text-emerald-50">Support</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/help-center" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms-of-service" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social Media */}
        <div className="md:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-5 text-emerald-50">Connect With Us</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <Mail size={18} className="text-emerald-300 mr-3 flex-shrink-0" />
              <a href="mailto:support@skillconnect.com" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                support@skillconnect.com
              </a>
            </div>
            <div className="flex items-center">
              <Phone size={18} className="text-emerald-300 mr-3 flex-shrink-0" />
              <a href="tel:+8809638800201" className="text-sm text-emerald-100 hover:text-white transition-colors duration-200">
                +880 9638 800201
              </a> {/* Updated phone number for Bangladesh */}
            </div>
          </div>
          <div className="flex space-x-5">
            <Link href="https://facebook.com/skillconnect" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-emerald-200 hover:text-white transition-colors duration-200">
              <Facebook size={22} />
            </Link>
            <Link href="https://twitter.com/skillconnect" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-emerald-200 hover:text-white transition-colors duration-200">
              <Twitter size={22} />
            </Link>
            <Link href="https://instagram.com/skillconnect" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-emerald-200 hover:text-white transition-colors duration-200">
              <Instagram size={22} />
            </Link>
            <Link href="https://linkedin.com/company/skillconnect" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-emerald-200 hover:text-white transition-colors duration-200">
              <Linkedin size={22} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 pt-6 border-t border-emerald-800 text-center">
        <p className="text-sm text-emerald-300">
          &copy; {new Date().getFullYear()} SkillConnect. All rights reserved. Crafted in Ashulia, Dhaka, Bangladesh.
        </p>
      </div>
    </footer>
  );
}