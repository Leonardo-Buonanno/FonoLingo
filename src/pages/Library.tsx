import { useEffect, useMemo, useState } from "react";
import { Check, Image as ImageIcon, Search, ShieldCheck } from "lucide-react";
import { PageHeading, Tag } from "../components/ui";
type Slide = {
  id: string;
  source: string;
  sourceHash: string;
  category: string;
  slide: number;
  image: string;
  title: string;
  labels: string[];
  shapes: {
    name: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};
type Manifest = {
  licenseStatus: string;
  sources: { file: string; slides: number }[];
  slides: Slide[];
};
export function Library() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selected, setSelected] = useState<Slide | null>(null);
  useEffect(() => {
    fetch("/anatomy/manifest.json")
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setManifest(null));
  }, []);
  const categories = manifest
    ? ["Todas", ...new Set(manifest.slides.map((s) => s.category))]
    : ["Todas"];
  const slides = useMemo(
    () =>
      manifest?.slides
        .filter(
          (s) =>
            (category === "Todas" || s.category === category) &&
            `${s.title} ${s.labels.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .slice(0, 80) || [],
    [manifest, query, category],
  );
  return (
    <>
      <PageHeading
        eyebrow="ACERVO ANATÔMICO"
        title="Biblioteca de imagens"
        description="Ilustrações importadas com origem, licença, hash e coordenadas dos objetos preservados."
      />
      {!manifest ? (
        <div className="card empty">
          <ImageIcon />
          <h2>Não foi possível carregar o acervo.</h2>
        </div>
      ) : (
        <>
          <div className="library-summary card">
            <span className="icon-box green">
              <ShieldCheck />
            </span>
            <div>
              <h2>{manifest.slides.length} ilustrações importadas</h2>
              <p>
                {manifest.sources.length} apresentações ·{" "}
                {manifest.licenseStatus}
              </p>
            </div>
            <Tag color="green">
              <Check size={13} />
              Rastreável
            </Tag>
          </div>
          <div className="library-filters">
            <label>
              <Search size={17} />
              <input
                aria-label="Buscar imagens"
                placeholder="Buscar estrutura ou sistema…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Filtrar categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="library-grid">
            {slides.map((slide) => (
              <button
                className="card library-item"
                key={slide.id}
                onClick={() => setSelected(slide)}
              >
                <img
                  loading="lazy"
                  src={slide.image}
                  alt={`Ilustração: ${slide.title}`}
                />
                <div>
                  <Tag>{slide.category}</Tag>
                  <h3>{slide.title}</h3>
                  <p>
                    {slide.source} · slide {slide.slide}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal card library-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-title"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.image}
              alt={`Ilustração ampliada: ${selected.title}`}
            />
            <h2 id="image-title">{selected.title}</h2>
            <p>
              {selected.category} · {selected.source} · slide {selected.slide}
            </p>
            <p>
              <strong>Textos identificados:</strong>{" "}
              {selected.labels.join(", ") || "Nenhum rótulo textual separado"}
            </p>
            <p className="hash">SHA-256 da origem: {selected.sourceHash}</p>
            <button className="btn secondary" onClick={() => setSelected(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
