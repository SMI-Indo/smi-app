"use client";

import { useState } from "react";

import { Video } from "@prisma/client";

export function VideoGallery({ initialVideos }: { initialVideos: Video[] }) {
  const [selectedTab, setSelectedTab] = useState<"ALL" | "TUTORIAL" | "GALLERY" | "FUN_FACT">("ALL");
  const [activeVideo, setActiveVideo] = useState<Video | null>(
    initialVideos.find((v) => v.category === "TUTORIAL") || initialVideos[0] || null
  );

  const tabs = [
    { id: "ALL" as const, label: "Semua Video" },
    { id: "TUTORIAL" as const, label: "Video Tutorial" },
    { id: "GALLERY" as const, label: "Dokumentasi Galeri" },
    { id: "FUN_FACT" as const, label: "Fun Fact Misdinar" },
  ];

  const filteredVideos = initialVideos.filter(
    (v) => selectedTab === "ALL" || v.category === selectedTab
  );

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center border-b border-outline-variant pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-6 py-2.5 rounded-full font-label-sm transition-all border ${
              selectedTab === tab.id
                ? "bg-primary border-primary text-white"
                : "bg-surface border-outline/30 text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Featured Bento Area */}
      {activeVideo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 rounded-3xl p-6 bg-surface-container-low border border-outline-variant card-glow">
          {/* Left: Active Player (16:9) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-neutral-950 rounded-2xl overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeVideo.thumbnail || ""}
                alt={activeVideo.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <a
                  href={activeVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center card-glow hover:scale-105 transition-all"
                >
                  <span className="material-symbols-outlined text-4xl">play_arrow</span>
                </a>
              </div>
              <span className="absolute bottom-4 right-4 bg-neutral-900/80 px-3 py-1 rounded-xl text-xs text-white font-mono">
                {activeVideo.duration}
              </span>
            </div>
            <div>
              <span className="font-label-sm text-xs text-primary font-bold">
                {activeVideo.category}
              </span>
              <h2 className="font-headline-md text-on-surface mt-1">{activeVideo.title}</h2>
              <p className="font-body-md text-on-surface-variant mt-2">
                {activeVideo.description}
              </p>
            </div>
          </div>

          {/* Right: Next Up List */}
          <div className="space-y-4 flex flex-col justify-start">
            <h3 className="font-label-lg text-on-surface-variant border-b border-outline-variant pb-2">
              Daftar Putar Kategori
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2">
              {filteredVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                    activeVideo.id === video.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-surface-container"
                  }`}
                >
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail || ""}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-body-md font-bold text-sm text-on-surface truncate">
                      {video.title}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      Durasi: {video.duration}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Other Videos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            onClick={() => setActiveVideo(video)}
            className="group cursor-pointer bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden card-glow flex flex-col transition-all"
          >
            <div className="relative aspect-video bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnail || ""}
                alt={video.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-102"
              />
              <span className="absolute bottom-2 right-2 bg-neutral-900/80 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                {video.duration}
              </span>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between">
              <div>
                <span className="font-label-sm text-[10px] text-primary uppercase font-bold">
                  {video.category}
                </span>
                <h4 className="font-body-md font-bold text-on-surface mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h4>
              </div>
              <div className="flex items-center justify-between mt-4 border-t border-outline-variant/30 pt-2 text-[10px] text-on-surface-variant font-mono">
                <span>{video.viewsCount}x tayang</span>
                <span>Oleh: {video.author}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
