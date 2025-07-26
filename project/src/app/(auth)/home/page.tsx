"use client";

import Banner from "@/components/userView/banner";
import Categories from "@/components/userView/Catagories";
import PopularServices from "@/components/userView/PopularServices";


function page() {
  return (
    <div>
      <Banner />
      <Categories />
      <PopularServices />
    </div>
  )
}

export default page