"use client";

import { useState, useRef, useEffect } from "react";
import { FaLinkedin, FaEnvelope } from "react-icons/fa";

export default function Footer() {
    const [showPopup, setShowPopup] = useState(false);
    const [copied, setCopied] = useState(false);
    const popupRef = useRef<HTMLDivElement | null>(null);

    const email = "yihanhon@usc.edu";

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            // `e.target` is an EventTarget; narrow to Node before calling `contains`.
            if (popupRef.current && e.target instanceof Node && !popupRef.current.contains(e.target)) {
                setShowPopup(false);
                setCopied(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <footer className="relative w-full py-8 px-6 flex flex-col items-center justify-center
                       border-t border-white/10 mt-20">

            {/* Icons */}
            <div className="flex gap-6 mb-4 relative">
                {/* LinkedIn */}
                <a
                    href="https://www.linkedin.com/in/yihan-hong-usc"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-gray-400 transition-all duration-300
                     hover:text-indigo-400 hover:scale-110"
                >
                    <FaLinkedin size={22} />
                </a>

                {/* Email */}
                <button
                    onClick={() => setShowPopup((prev) => !prev)}
                    aria-label="Email"
                    className="text-gray-400 transition-all duration-300
                     hover:text-indigo-400 hover:scale-110"
                >
                    <FaEnvelope size={22} />
                </button>

                {/* Email Popup */}
                {showPopup && (
                    <div
                        ref={popupRef}
                        className="absolute -top-14 right-0 bg-zinc-900 border border-white/10
                       rounded-lg px-4 py-2 text-sm text-gray-300
                       shadow-xl animate-fade-in"
                    >
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 hover:text-indigo-400 transition-colors"
                        >
                            {copied ? "Copied!" : email}
                        </button>
                    </div>
                )}
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500 text-center">
                © {new Date().getFullYear()} Yihan Hong. All rights reserved.
            </p>
        </footer>
    );
}
