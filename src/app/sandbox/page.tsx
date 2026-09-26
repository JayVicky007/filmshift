"use client";

import React, { useState, useRef } from "react";
import ContentCard from "@/components/ContentCard";
import SearchSuggestions from "@/components/SearchSuggestions";
import { redirect } from "next/navigation";

export default function SandboxPage() {
  // 🚀 Turn off the sandbox layout route for production compilation runs
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  

// 1. Mock Data representing your TMDB search payload stream
const mockSearchResults = [
  { id: 27205, title: "Inception", poster_path: "/9gk7adHY9CjST6Y29X9wZg2R7Y8.jpg", release_date: "2010-07-15", vote_average: 8.4 },
  { id: 157336, title: "Interstellar", poster_path: "/gEU2QniE6E77NIvHGvPbgDcwtgC.jpg", release_date: "2014-11-05", vote_average: 8.4 },
  { id: 11324, title: "Shutter Island", poster_path: "/kve20wIIgZzb68g1g4jZOCjIY9g.jpg", release_date: "2010-02-14", vote_average: 8.2 },
  { id: 49051, title: "The Hobbit", poster_path: "/b8568Y7Du6bM666g67v6u6gB.jpg", release_date: "2012-11-26", vote_average: 7.7 },
  { id: 120, title: "The Lord of the Rings", poster_path: "/6oom6Q72z6r7J6Bw67v6U6gB.jpg", release_date: "2001-12-18", vote_average: 8.4 },
];

// 2. Mock Data simulating autocomplete drop items
const mockSuggestions = [
  { id: 27205, title: "Inception (2010)", mediaType: "Movie", rawMediaType: "movie" as const, posterPath: "/9gk7adHY9CjST6Y29X9wZg2R7Y8.jpg" },
  { id: 1399, title: "Game of Thrones (2011)", mediaType: "TV Series", rawMediaType: "tv" as const, posterPath: "/1xsYj8477DDZZ6gB.jpg" },
];


}