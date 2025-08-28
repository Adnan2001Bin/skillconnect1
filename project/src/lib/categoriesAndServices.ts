// lib/categoriesAndServices.js (No changes needed here, just for context)
import c_icon1 from "../../public/Catagories/programing.png";
import c_icon2 from "../../public/Catagories/Graphics & Design.png";
import c_icon3 from "../../public/Catagories/Digital Marketing.png";
import c_icon4 from "../../public/Catagories/Video & Animation.png";
import c_icon5 from "../../public/Catagories/AI Services.png";
import c_icon6 from "../../public/Catagories/Business.png";
import c_icon7 from "../../public/Catagories/Writing & Translation.png";
import c_icon8 from "../../public/Catagories/Consulting.png";


import p_icon1 from "../../public/popular-services/19362653.jpg";
import p_icon2 from "../../public/popular-services/2176762.jpg";
import p_icon3 from "../../public/popular-services/3405349.jpg";
import p_icon4 from "../../public/popular-services/24559.jpg";
import p_icon5 from "../../public/popular-services/19198406.jpg";
import p_icon6 from "../../public/popular-services/8852115.jpg";
import p_icon7 from "../../public/popular-services/2336.jpg";
import p_icon8 from "../../public/popular-services/5686602.jpg";
import p_icon9 from "../../public/popular-services/5396346.jpg";


import c1 from "../../public/card/web-development_2210153.png"
import c2 from "../../public/card/illustrator_552254.png"
import c3 from "../../public/card/marketplace_2171363.png"
import c4 from "../../public/card/3d-modeling_4661026.png"
import c5 from "../../public/card/ai_6985703.png"
import c6 from "../../public/card/content-creator_4698304.png"
import c7 from "../../public/card/2d_5261290.png"
import c8 from "../../public/card/ui_1260243.png"
import c9 from "../../public/card/online-learning_16940069.png"


export const categories = [
  { value: "programming_tech", label: "Programming & Tech",icon: c_icon1 },
  { value: "graphics_design", label: "Graphics & Design" ,icon: c_icon2},
  { value: "digital_marketing", label: "Digital Marketing" ,icon: c_icon3},
  { value: "video_animation", label: "Video & Animation" ,icon: c_icon4},
  { value: "ai_services", label: "AI Services" ,icon: c_icon5},
  { value: "business", label: "Business" ,icon: c_icon6},
  { value: "writing_translation", label: "Writing & Translation" ,icon: c_icon7},
  { value: "consulting", label: "Consulting" ,icon: c_icon8},
];

export const popularServices = [
  {
    id: "1",
    title: "Web application development",
    icon: p_icon1,
    value: "programming_tech",
  },
  {
    id: "2",
    title: "Logo Design",
    icon: p_icon2,
    value: "graphics_design",
  },
  {
    id: "3",
    title: "E-Commerce Marketing",
    icon: p_icon3,
    value: "digital_marketing",
  },
  {
    id: "4",
    title: "3D animation",
    icon: p_icon4,
    value: "video_animation",
  },
  {
    id: "5",
    title: "AI model training and optimization",
    icon: p_icon5,
    value: "ai_services",
  },
  {
    id: "6",
    title: "Article writing",
    icon: p_icon6,
    value: "writing_translation",
  },
   {
    id: "7",
    title: "2D animation",
    icon: p_icon7,
    value: "writing_translation",
  },
  {
    id: "8",
    title: "UI/UX design",
    icon: p_icon8,
    value: "writing_translation",
  },
  {
    id: "9",
    title: "Blog writing Illustration",
    icon: p_icon9,
    value: "writing_translation",
  },
];

export const card = [
  {
    id: "1",
    title: "Web application development",
    icon: c1,
    value: "programming_tech",
  },
  {
    id: "2",
    title: "Logo Design",
    icon: c2,
    value: "graphics_design",
  },
  {
    id: "3",
    title: "E-Commerce Marketing",
    icon: c3,
    value: "digital_marketing",
  },
  {
    id: "4",
    title: "3D animation",
    icon: c4,
    value: "video_animation",
  },
  {
    id: "5",
    title: "AI model training and optimization",
    icon: c5,
    value: "ai_services",
  },
  {
    id: "6",
    title: "Article writing",
    icon: c6,
    value: "writing_translation",
  },
   {
    id: "7",
    title: "2D animation",
    icon: c7,
    value: "writing_translation",
  },
  {
    id: "8",
    title: "UI/UX design",
    icon: c8,
    value: "writing_translation",
  },
  {
    id: "9",
    title: "Blog writing Illustration",
    icon: c9,
    value: "writing_translation",
  },
];

export const servicesByCategory: { [key: string]: string[] } = {
  programming_tech: [
    "Front-end development (HTML, CSS, JavaScript, React, Angular, Vue.js)",
    "Back-end development (Node.js, Python, PHP, Ruby, Java)",
    "Full-stack development",
    "WordPress, Shopify, or other CMS development",
    "E-commerce website creation",
    "Web application development",
    "iOS app development (Swift, Objective-C)",
    "Android app development (Kotlin, Java)",
    "Cross-platform app development (Flutter, React Native)",
    "Custom software solutions",
    "Desktop application development",
    "API development and integration",
    "Database development (SQL, NoSQL, MongoDB, MySQL)",
    "2D/3D game development",
    "Unity or Unreal Engine development",
    "Mobile game development",
    "Cloud computing setup (AWS, Azure, Google Cloud)",
    "CI/CD pipeline setup",
    "Server management and configuration",
    "Penetration testing",
    "Network security",
    "IT consulting",
    "Data recovery",
    "Smart contract development",
    "NFT creation",
    "Cryptocurrency wallet development",
    "Website maintenance",
    "Bug fixing",
    "Technical support and troubleshooting",
    "Data scraping and web crawling",
    "Data visualization",
    "Machine learning model development",
    "Chatbot development",
    "IoT (Internet of Things) solutions",
    "Automation scripts (Python, Bash)",
  ],
  graphics_design: [
    "Logo design",
    "Brand identity creation (business cards, letterheads)",
    "Brand style guides",
    "UI/UX design",
    "Website mockups",
    "Mobile app interface design",
    "Social media graphics",
    "Banners and advertisements",
    "Infographics",
    "Brochures, flyers, and posters",
    "Custom illustrations",
    "Character design",
    "Digital art",
    "Concept art",
    "Book covers",
    "Packaging design",
    "Menu design",
    "T-shirt design",
    "Merchandise mockups",
    "3D modeling and rendering",
    "Product visualization",
    "Photo editing and retouching",
    "Presentation design",
    "Motion graphics",
  ],
  digital_marketing: [
    "On-page SEO",
    "Off-page SEO (link building)",
    "Technical SEO",
    "E-Commerce Marketing",
    "Keyword research",
    "Social media management (Facebook, Instagram, Twitter, LinkedIn)",
    "Ad campaign setup (Facebook Ads, Instagram Ads)",
    "Content creation for social media",
    "Blog management",
    "Email marketing campaigns",
    "Content strategy development",
    "Google Ads setup and management",
    "Bing Ads",
    "Retargeting campaigns",
    "Influencer outreach",
    "Campaign management",
    "Email template design",
    "Automation setup (Mailchimp, Klaviyo)",
    "Google Analytics setup",
    "Marketing funnel creation",
    "Conversion rate optimization (CRO)",
    "Affiliate marketing",
    "Local SEO",
    "Video ad creation",
  ],
  video_animation: [
    "Post-production editing",
    "Color grading",
    "Sound design",
    "2D animation",
    "3D animation",
    "Motion graphics",
    "Whiteboard animation",
    "Corporate videos",
    "Promotional videos",
    "Product demo videos",
    "Event videography",
    "Animated explainer videos",
    "Screencast tutorials",
    "Short-form video content (Reels, TikToks, YouTube Shorts)",
    "Video ads",
    "Drone videography",
    "Stop-motion animation",
    "Subtitling and captioning",
  ],
  ai_services: [
    "Model development (classification, regression, clustering)",
    "Deep learning (neural networks, CNNs, RNNs)",
    "Natural language processing (NLP)",
    "Chatbot development (conversational AI)",
    "AI integration into applications",
    "Computer vision solutions",
    "Predictive analytics",
    "Data preprocessing and cleaning",
    "AI-driven insights",
    "AI-powered workflow automation",
    "Robotic process automation (RPA)",
    "AI model training and optimization",
    "Custom AI algorithm development",
    "Voice recognition systems",
  ],
  business: [
    "Business plan writing",
    "Financial forecasting",
    "Pitch deck creation",
    "Shopify store setup",
    "Amazon seller account management",
    "Product listing optimization",
    "Administrative support",
    "Calendar management",
    "Data entry",
    "Customer service outsourcing",
    "Live chat support",
    "Bookkeeping",
    "Accounting",
    "Tax preparation",
    "Recruitment and talent sourcing",
    "HR policy development",
    "Market research",
    "Supply chain management",
    "CRM setup (HubSpot, Salesforce)",
  ],
  writing_translation: [
    "Blog writing",
    "Article writing",
    "Website content",
    "Product descriptions",
    "Ad copy",
    "Sales pages",
    "Email copy",
    "Fiction and non-fiction writing",
    "Scriptwriting",
    "Poetry",
    "Grammar and style editing",
    "Manuscript proofreading",
    "User manuals",
    "Whitepapers",
    "Documentation",
    "Document translation (e.g., English to Spanish, etc.)",
    "Website localization",
    "Subtitling and transcription",
    "Resume writing",
    "Cover letter writing",
    "Ghostwriting",
  ],
  consulting: [
    "Startup consulting",
    "Growth strategy",
    "Operational efficiency",
    "Digital marketing strategy",
    "Brand positioning",
    "Market entry strategy",
    "Investment advice",
    "Financial planning",
    "Budgeting and cost optimization",
    "Technology stack recommendations",
    "Cybersecurity consulting",
    "Cloud migration strategy",
    "Contract review",
    "Intellectual property advice",
    "Compliance consulting",
    "Employee training programs",
    "Organizational development",
    "Sustainability consulting",
    "Risk management",
    "Project management",
  ],
};