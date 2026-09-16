import { fmtLong } from "../utils/parseMarkdown.js";
import "./Blog.css";

export default function Blog({ post }) {
    if (!post) return null;

    return (
        <article className="post">
            <div className="header">
                <h1>{post.title}</h1>
            </div>
            <div className="header sub b">
                <p className="t-code">
                    <em>
                        {fmtLong(post.date)}
                        {post.location ? ` — ${post.location}` : ""}
                    </em>
                </p>
            </div>
            <div
                className="content-body shorter b"
                dangerouslySetInnerHTML={{ __html: post.html }}
            />

            <div className="participants">
                {post.participants?.length > 0 && (
                    <>
                        <div className="cell h1u b">
                            <h2>
                                Participants // Participants // Participants
                            </h2>
                        </div>
                        <div className="cell b">
                            <p>
                                {post.participants.map((participant, i) => (
                                    <>
                                        {participant.name} {/* <br /> */}
                                        {" / "}
                                        <span className="t-code">
                                            {participant.affiliation}
                                        </span>
                                        <hr />
                                    </>
                                ))}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {post.img && (
                <div className="img">
                    <img
                        src={post.img}
                        alt={post.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
            )}
        </article>
    );
}
