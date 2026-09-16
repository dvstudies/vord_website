import { Fragment } from "react";
import { fmtLong } from "../utils/parseMarkdown.js";
import { useSlideEntered } from "../hooks/SlideEnteredContext.jsx";
import { useLatchedTrue } from "../hooks/useLatchedTrue.js";
import LoopXButton from "./LoopXButton.jsx";
import SlidingY from "./SlidingY.jsx";

import "./Blog.css";

export default function Blog({ post }) {
    const entered = useSlideEntered();
    const isOpen = useLatchedTrue(entered);

    if (!post) return null;

    return (
        <article className="post">
            <div className={`header`}>
                <div className={`sliding-x${isOpen ? " is-visible" : ""}`}>
                    <h1>{post.title}</h1>
                </div>
            </div>
            <div className="header sub b">
                <p className="t-code">
                    <em>
                        {fmtLong(post.date)}
                        {post.location ? ` — ${post.location}` : ""}
                    </em>
                </p>
            </div>
            <SlidingY open={entered}>
                <div
                    className="content-body shorter b"
                    dangerouslySetInnerHTML={{ __html: post.html }}
                />
            </SlidingY>

            <div className="participants">
                {post.participants?.length > 0 && (
                    <>
                        <LoopXButton
                            text="Participants"
                            className="cell h1u b"
                        />
                        <div className="cell b">
                            <p>
                                {post.participants.map((participant, i) => (
                                    <Fragment key={i}>
                                        {participant.name} {/* <br /> */}
                                        {" / "}
                                        <span className="t-code">
                                            {participant.affiliation}
                                        </span>
                                        <hr />
                                    </Fragment>
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
