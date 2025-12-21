import TextType from './ui/TextType';
import PixelBlast from './ui/PixelBlast';
import StatusCard from "./status/StatusCard";

export default function Hero() {
    return (
        <section className="relative flex min-h-screen items-center px-6 md:px-20" id="top">
            <div className="absolute inset-0">
                <PixelBlast color="#0ea5e9" />
            </div>
            <div className="relative z-10 flex w-full items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold tracking-[0.25em] text-sky-400 uppercase mb-3">
                        Software Developer · Student
                    </p>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Hey, I’m <span className="text-sky-400">Yihan</span> 👋
                    </h1>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 w-[50rem]">
                        I build{" "}
                        <TextType
                            text={[
                                "full-stack systems.",
                                "delightful interfaces.",
                                "data-driven applications.",
                            ]}
                        />
                    </h1>
                    <p className="text-sm md:text-base text-slate-300 mb-6 max-w-xl">
                        I am a Computer Engineering and Computer Science student at the University of Southern California who loves building
                        tools that solve real-world problems.
                        <br></br>
                        <br></br>
                        I’m currently looking for software engineering internships where I can implement user-facing features across the stack.
                    </p>
                    <div className="flex gap-3">
                        <a
                            href="/projects"
                            className="rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 transition-colors"
                        >
                            View projects
                        </a>
                        <a
                            href="https://github.com/yih0nk"
                            className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 hover:border-slate-300 transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
                <div className="flex-1 max-w-md lg:max-w-lg xl:max-w-xl">
                    <StatusCard />
                </div>
            </div>
        </section>
    );
}
