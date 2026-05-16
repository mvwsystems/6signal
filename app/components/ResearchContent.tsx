"use client";
import { useState } from "react";
import Link from "next/link";
import type { PostMeta } from "../lib/blog";

const TABS = [
  "All",
  "White Papers",
  "Insights",
  "Field Notes",
  "Case Studies",
  "Teardowns",
  "Market Reports",
  "Trainings",
];

const INSIGHT_CATS = new Set(["AI Visibility", "Local SEO", "Content Strategy", "Insight"]);

function getDisplayType(post: PostMeta): string {
  if (post.contentType) return post.contentType;
  if (post.category === "White Paper") return "White Paper";
  if (INSIGHT_CATS.has(post.category)) return "Insight";
  return "Field Note";
}

function filterByTab(posts: PostMeta[], tab: string): PostMeta[] {
  if (tab === "All") return posts;
  if (tab === "White Papers")
    return posts.filter(
      (p) => p.category === "White Paper" || p.contentType === "White Paper"
    );
  if (tab === "Insights")
    return posts.filter(
      (p) => INSIGHT_CATS.has(p.category) && p.category !== "White Paper"
    );
  if (tab === "Field Notes")
    return posts.filter(
      (p) =>
        !INSIGHT_CATS.has(p.category) &&
        p.category !== "White Paper" &&
        p.contentType !== "White Paper"
    );
  return [];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ResearchContent({ posts }: { posts: PostMeta[] }) {
  const [activeTab, setActiveTab] = useState("All");

  const whitePapers = posts.filter(
    (p) => p.category === "White Paper" || p.contentType === "White Paper"
  );
  const nonWpPosts = posts.filter(
    (p) => p.category !== "White Paper" && p.contentType !== "White Paper"
  );
  const filtered = filterByTab(posts, activeTab);
  const gridPosts = activeTab === "All" ? nonWpPosts : filtered;

  return (
    <>
      {/* Category Navigation */}
      <section className="cat-nav-section">
        <div className="wrap">
          <nav className="cat-nav" aria-label="Research categories">
            {TABS.map((tab) => {
              const count =
                tab === "All" ? posts.length : filterByTab(posts, tab).length;
              return (
                <button
                  key={tab}
                  className={`cat-nav-btn${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                >
                  {tab}
                  <span className="cat-nav-count">{count}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* White Papers section — visible in All + White Papers tabs */}
      {(activeTab === "All" || activeTab === "White Papers") &&
        whitePapers.length > 0 && (
          <section className="wp-section rule">
            <div className="wrap">
              <div className="research-section-header">
                <span className="idx">White Papers</span>
                <span className="idx research-count">
                  {whitePapers.length}{" "}
                  {whitePapers.length === 1 ? "paper" : "papers"}
                </span>
              </div>
              <div className="wp-cards">
                {whitePapers.map((post) => (
                  <WpCard
                    key={post.slug}
                    post={post}
                    displayType={getDisplayType(post)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Posts grid — hidden in White Papers tab */}
      {activeTab !== "White Papers" && (
        <section className="research-grid-section rule">
          <div className="wrap">
            <div className="research-section-header">
              <span className="idx">
                {activeTab === "All" ? "All Research" : activeTab}
              </span>
              <span className="idx research-count">
                {gridPosts.length}{" "}
                {gridPosts.length === 1 ? "post" : "posts"}
              </span>
            </div>
            {gridPosts.length > 0 ? (
              <div className="blog-grid">
                {gridPosts.map((post) => (
                  <ResearchCard
                    key={post.slug}
                    post={post}
                    displayType={getDisplayType(post)}
                  />
                ))}
              </div>
            ) : (
              <div className="research-empty">
                <span className="idx">
                  No {activeTab.toLowerCase()} published yet.
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function WpCard({
  post,
  displayType,
}: {
  post: PostMeta;
  displayType: string;
}) {
  return (
    <Link href={`/research/${post.slug}`} className="wp-card">
      <div className="wp-card-type">
        <span className="wp-card-type-dot" />
        {displayType}
      </div>
      <h3 className="wp-card-title">{post.title}</h3>
      <p className="wp-card-desc">{post.description}</p>
      <div className="wp-card-footer">
        <span className="idx">{post.readTime}</span>
        <span className="wp-card-read">
          Read
          <svg
            viewBox="0 0 16 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function ResearchCard({
  post,
  displayType,
}: {
  post: PostMeta;
  displayType: string;
}) {
  return (
    <Link href={`/research/${post.slug}`} className="blog-card reveal">
      <div className="blog-card-meta">
        <span className="idx blog-category-label">{displayType}</span>
        <span className="blog-meta-sep">·</span>
        <span className="idx">{post.readTime}</span>
      </div>
      <h3 className="blog-card-title">{post.title}</h3>
      <p className="blog-card-desc">{post.description}</p>
      <div className="blog-card-footer">
        <span className="idx">{formatDate(post.date)}</span>
        <span className="blog-card-read">
          Read
          <svg
            viewBox="0 0 16 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
