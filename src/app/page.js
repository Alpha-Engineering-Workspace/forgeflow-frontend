import Image from "next/image";

const capabilities = [
  {
    number: "01",
    title: "Project delivery",
    description:
      "Organize projects, manage issues, and visualize progress.",
  },
  {
    number: "02",
    title: "Team collaboration",
    description:
      "Connect team members, conversations, and activity.",
  },
  {
    number: "03",
    title: "Client relationships",
    description:
      "Bring companies, contacts, and deals into one workflow.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Image
          src="/forgeflow-logo.png"
          alt="ForgeFlow"
          width={205}
          height={76}
          priority
        />

        <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface)] px-4 py-2 text-xs font-medium">
          Building v1.0
        </span>
      </header>

      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-20 md:py-32">
        <div className="ff-dot-grid pointer-events-none absolute inset-0 -z-10 opacity-70" />

        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 font-semibold tracking-widest text-[var(--ff-primary)] uppercase">
            Your work. In motion.
          </p>

          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            From idea to impact.
            <span className="mt-3 block text-[var(--ff-primary)]">
              One seamless flow.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-[var(--ff-muted)]">
            ForgeFlow brings project delivery, team collaboration,
            and customer relationships together in one workspace.
          </p>

          <a
            href="#roadmap"
            className="mt-9 inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--ff-primary)] px-7 font-medium text-[var(--ff-on-primary)] hover:bg-[var(--ff-primary-hover)]"
          >
            Explore ForgeFlow
          </a>
        </div>
      </section>

      <section
        id="roadmap"
        className="mx-auto max-w-7xl px-6 pb-24"
      >
        <div className="mb-7 h-1 w-24 rounded-full ff-gradient" />

        <h2 className="mb-8 text-2xl font-semibold">
          Everything connected.
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {capabilities.map((item) => (
            <article
              key={item.number}
              className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-7"
            >
              <span className="text-sm font-semibold text-[var(--ff-primary)]">
                {item.number}
              </span>

              <h3 className="mt-7 text-xl font-semibold">
                {item.title}
              </h3>

              <p className="mt-3 leading-7 text-[var(--ff-muted)]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--ff-border)] px-6 py-8 text-center text-sm text-[var(--ff-muted)]">
        ForgeFlow — Built for connected work.
      </footer>
    </main>
  );
}