const FALLBACK_ARTWORKS = [
  {
    title: "The Milkmaid",
    artist: "Johannes Vermeer",
    year: "c. 1660",
    description:
      "A domestic interior becomes an image of concentration, suspended work, light, surface, and repeated attention.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg",
    source: "Wikimedia Commons"
  },
  {
    title: "A Sunday Afternoon on the Island of La Grande Jatte",
    artist: "Georges Seurat",
    year: "1884–1886",
    description:
      "A field of figures, leisure, optics, atmosphere, and discrete marks is reassembled as a gridded screen.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/b7/Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg",
    source: "Wikimedia Commons"
  },
  {
    title: "Wanderer above the Sea of Fog",
    artist: "Caspar David Friedrich",
    year: "c. 1818",
    description:
      "A solitary figure faces an unstable landscape, turning distance, atmosphere, and viewpoint into an image-machine.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/af/Caspar_David_Friedrich_-_Wanderer_above_the_Sea_of_Fog.jpeg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_Wanderer_above_the_Sea_of_Fog.jpeg",
    source: "Wikimedia Commons"
  }
];

export function getDailyArtwork() {
  const d = new Date();
  const seed = Number(
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  );

  return FALLBACK_ARTWORKS[seed % FALLBACK_ARTWORKS.length];
}

export default FALLBACK_ARTWORKS;
