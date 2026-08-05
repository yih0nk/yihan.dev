"use client";

import { motion } from "framer-motion";

export default function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  /** Optional layout classes — pass "flex-1 flex flex-col" to let a page
   *  stretch inside <main> (needed to centre content vertically). */
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
