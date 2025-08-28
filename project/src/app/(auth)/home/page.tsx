"use client";

import Banner from "@/components/userView/banner";
import Categories from "@/components/userView/Catagories";
import ExpertMatchComponent from "@/components/userView/FindAnExpert";
import JoinSkillConnect from "@/components/userView/JoinSkillConnect";
import LandingPage from "@/components/userView/LandingPage";
import PopularServices from "@/components/userView/PopularServices";

//for userview
function page() {
  return (
    <div >
      <Banner />
      <Categories />
      <PopularServices />
      <LandingPage />
      <ExpertMatchComponent />
      <JoinSkillConnect />
    </div>
  )
}

export default page