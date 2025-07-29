"use client";

import Banner from "@/components/userView/banner";
import Categories from "@/components/userView/Catagories";
import LandingPage from "@/components/userView/LandingPage";
import PopularServices from "@/components/userView/PopularServices";


function page() {
  return (
    <div>
      <Banner />
      <Categories />
      <PopularServices />
      <LandingPage />
    </div>
  )
}

export default page