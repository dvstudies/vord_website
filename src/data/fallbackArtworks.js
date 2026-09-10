export async function getDailyArtwork(dateString) {
    const date = dateString ? new Date(dateString) : new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const endpoint = `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${year}/${month}/${day}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(
                `Wikimedia API error: ${response.status} ${response.statusText}`,
            );
        }

        const data = await response.json();
        const image = data.image;

        if (!image) {
            throw new Error("No picture of the day found for the given date.");
        }

        return {
            title: image.title
                ? image.title.replace(/^File:/, "")
                : "Picture of the Day",
            imageUrl: image.thumbnail?.source || image.image?.source,
            fullResUrl: image.image?.source,
            description: image.description?.text || "",
            pageUrl: image.file_page,
        };
    } catch (error) {
        console.error("Error executing getDailyArtwork():", error);
        throw error;
    }
}
