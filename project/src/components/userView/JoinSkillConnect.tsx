"use client";

import { Button } from "@/components/ui/button";
import { Images } from "@/lib/images";
import { CheckCircle, Users, Star, Clock } from "lucide-react";
import Image from "next/image";

function JoinSkillConnect() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-100 to-white">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
          Why Join SkillConnect?
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Unlock your potential with SkillConnect, the ultimate platform to
          connect with top talent, showcase your skills, and grow your career.
          Whether you're a client seeking expert services or a professional
          looking for opportunities, SkillConnect offers a seamless experience
          with:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Users className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Global Network
            </h3>
            <p className="text-gray-600 text-center">
              Connect with experts worldwide to find the perfect match for your
              needs.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Star className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Top Talent
            </h3>
            <p className="text-gray-600 text-center">
              Work with highly skilled professionals rated by the community.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Clock className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Fast Delivery
            </h3>
            <p className="text-gray-600 text-center">
              Get your projects completed on time with our efficient workflow.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CheckCircle className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Secure Payments
            </h3>
            <p className="text-gray-600 text-center">
              Enjoy safe and reliable transactions with every project.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Image
            src={Images.JoinSkillConnect1}
            alt="SkillConnect Community"
            width={300}
            height={200}
            className="rounded-lg object-cover shadow-md"
          />
          <Image
            src={Images.JoinSkillConnect2}
            alt="SkillConnect Workspace"
            width={300}
            height={200}
            className="rounded-lg object-cover shadow-md"
          />
        </div>
        <p className="text-md text-gray-600 mt-6 max-w-2xl mx-auto">
          Join thousands of satisfied users who have transformed their ideas
          into reality. Sign up today and start building your success story with
          SkillConnect!
        </p>
       
      </div>
    </div>
  );
}

export default JoinSkillConnect;

