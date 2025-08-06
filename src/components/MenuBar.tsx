import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import redPandaLogo from "../assets/pabu_logo.png";

export const MenuBar = () => {
  return (
    <div className="h-20 bg-[#FBF3EA] flex items-center justify-between px-6 border-b border-border/30">
      <Link 
        to="/settings" 
        className="p-3 rounded-xl hover:bg-black/5 transition-smooth"
      >
        <Settings className="w-6 h-6 text-foreground" />
      </Link>
      
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <img 
          src={redPandaLogo} 
          alt="Logo" 
          className="w-12 h-12"
        />
      </div>
      
      <div className="w-12"></div>
    </div>
  );
};