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
                        <div className="cell b">
                            <h2>Participants</h2>
                        </div>
                        <div className="cell b">
                            {post.participants.map((participant, i) => (
                                <p>
                                    {participant.name} <br />
                                    <span className="t-code">
                                        {participant.affiliation}
                                    </span>
                                </p>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </article>
    );
}
