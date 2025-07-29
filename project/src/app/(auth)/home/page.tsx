"use client";

import Banner from "@/components/userView/banner";
import Categories from "@/components/userView/Catagories";
import ExpertMatchComponent from "@/components/userView/FindAnExpert";
import LandingPage from "@/components/userView/LandingPage";
import PopularServices from "@/components/userView/PopularServices";


function page() {
  return (
    <div >
      <Banner />
      <Categories />
      <PopularServices />
      <LandingPage />
      <ExpertMatchComponent />
    </div>
  )
}

export default page