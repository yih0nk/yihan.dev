export default function Projects() {
    return (
        <section
            id="projects"
            className="py-20 px-6 md:px-20 flex flex-col items-center justify-center scroll-mt-20"
        >
            <h2 className="text-4xl font-bold mb-10">Projects</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">

                {/* HackSC Landing Website */}
                <div
                    className="group relative bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden
                       transition-all duration-500 ease-out
                       hover:-translate-y-3 hover:rotate-[-2deg] hover:scale-[1.03]
                       hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/20"
                >
                    {/* Glow sweep */}
                    <span
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
                         transition-opacity duration-500
                         bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent"
                    />

                    <h3
                        className="relative text-xl font-semibold transition-all duration-300
                         group-hover:text-indigo-400 group-hover:translate-x-1"
                    >
                        HackSC — Landing Website
                    </h3>

                    <p className="relative text-sm text-gray-400 mt-1">
                        Sep 2025 – Present
                    </p>

                    <p
                        className="relative mt-3 text-sm text-gray-300 transition-all duration-300
                         group-hover:translate-x-1"
                    >
                        Building HackSC’s official landing website by translating Figma
                        designs into accessible, responsive UI components.
                    </p>

                    <ul className="relative mt-4 list-disc list-inside text-sm space-y-2 text-gray-300">
                        <li
                            className="transition-all duration-300 group-hover:translate-x-1"
                        >
                            Developed UI using TypeScript, React/Next.js, and Tailwind CSS
                            with a strong focus on responsiveness and accessibility.
                        </li>
                        <li
                            className="transition-all duration-300 group-hover:translate-x-1"
                        >
                            Collaborated in a 10+ engineer team using Git, pull requests,
                            and code reviews to deliver features iteratively.
                        </li>
                    </ul>

                    <div className="relative mt-4 flex flex-wrap gap-2 text-xs">
                        {["TypeScript", "React", "Next.js", "Tailwind CSS"].map((tech) => (
                            <span
                                key={tech}
                                className="px-2 py-1 rounded-md bg-white/10 text-gray-300
                             transition-all duration-300
                             group-hover:scale-110 group-hover:bg-indigo-400/10"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Rocket the Robot */}
                <div
                    className="group relative bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden
                       transition-all duration-500 ease-out
                       hover:-translate-y-3 hover:rotate-[2deg] hover:scale-[1.03]
                       hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/20"
                >
                    {/* Glow sweep */}
                    <span
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
                         transition-opacity duration-500
                         bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent"
                    />

                    <h3
                        className="relative text-xl font-semibold transition-all duration-300
                         group-hover:text-indigo-400 group-hover:translate-x-1"
                    >
                        Rocket the Robot — USC Makers
                    </h3>

                    <p className="relative text-sm text-gray-400 mt-1">
                        Sep 2025 – Present
                    </p>

                    <p
                        className="relative mt-3 text-sm text-gray-300 transition-all duration-300
                         group-hover:translate-x-1"
                    >
                        Robotics project focused on power distribution, sensor integration,
                        and autonomous behavior prototyping.
                    </p>

                    <ul className="relative mt-4 list-disc list-inside text-sm space-y-2 text-gray-300">
                        <li
                            className="transition-all duration-300 group-hover:translate-x-1"
                        >
                            Designed power distribution and sensor integration using
                            microcontrollers, stepper motors, and servo motors.
                        </li>
                        <li
                            className="transition-all duration-300 group-hover:translate-x-1"
                        >
                            Prototyped autonomous control strategies using Python and
                            Isaac Sim, exploring reinforcement learning workflows.
                        </li>
                    </ul>

                    <div className="relative mt-4 flex flex-wrap gap-2 text-xs">
                        {["Python", "Microcontrollers", "Isaac Sim", "Robotics"].map(
                            (tech) => (
                                <span
                                    key={tech}
                                    className="px-2 py-1 rounded-md bg-white/10 text-gray-300
                               transition-all duration-300
                               group-hover:scale-110 group-hover:bg-indigo-400/10"
                                >
                                    {tech}
                                </span>
                            )
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
}
