export default function Experience() {
    return (
        <section id="experience" className="py-5 px-6 md:px-20 flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold mb-10">My Experiences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {/* Triple J Canada */}
                <a href="https://www.jjjcanada.com" target="_blank"
                    rel="noopener noreferrer" className="bg-white/5 border border-white/10 rounded-xl p-6  transition-all duration-300 ease-out
                        hover:-translate-y-2 hover:scale-[1.02]
                        hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10">
                    <h3 className="text-xl font-semibold">Triple J Canada Consulting Inc.</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Full Stack Developer · Jun 2025 – Aug 2025
                    </p>
                    <ul className="mt-4 list-disc list-inside text-sm space-y-2 text-gray-300">
                        <li>
                            Built and shipped a tax-filing client portal supporting 14,000+
                            online submissions using Flask, SQL, and JavaScript.
                        </li>
                        <li>
                            Implemented secure file transfer over custom TCP/IP with validation,
                            logging, and error handling.
                        </li>
                        <li>
                            Developed responsive UI flows that reduced manual follow-ups and
                            improved usability.
                        </li>
                    </ul>
                </a>
                {/* Mississauga Chess Club */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 ease-out
                        hover:-translate-y-2 hover:scale-[1.02]
                        hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10">
                    <h3 className="text-xl font-semibold">Mississauga Chess Club</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        System Developer · Oct 2023 – Jun 2025
                    </p>
                    <ul className="mt-4 list-disc list-inside text-sm space-y-2 text-gray-300">
                        <li>
                            Architected a tournament and membership system for 1,000+ members
                            using Flask, SQL, and JavaScript.
                        </li>
                        <li>
                            Built an Android app with C# and .NET MAUI for tournament
                            registration and profile management.
                        </li>
                        <li>
                            Automated eligibility rules and SwissSys pairing generation,
                            reducing setup time by 97%.
                        </li>
                    </ul>
                </div>
                {/* SolveXchange Initiative */}
                <a href="https://www.solvexchange.ca" target="_blank"
                    rel="noopener noreferrer" className="bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 ease-out
                        hover:-translate-y-2 hover:scale-[1.02]
                        hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10">
                    <h3 className="text-xl font-semibold">SolveXchange Initiative</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Chief of IT Operations · Feb 2024 – Jun 2025
                    </p>
                    <ul className="mt-4 list-disc list-inside text-sm space-y-2 text-gray-300">
                        <li>
                            Led a 3-engineer team to build a full-stack platform connecting
                            100+ students with community projects.
                        </li>
                        <li>
                            Designed REST APIs for authentication, forums, and user management.
                        </li>
                        <li>
                            Optimized database queries to improve performance under concurrent
                            usage.
                        </li>
                    </ul>
                </a>
            </div>
        </section>
    )
}