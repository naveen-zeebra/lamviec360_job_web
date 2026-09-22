"use client";
import Header from "../layout/Header";

export default function SeekerHeader({ lang, setLang }) {
  return <Header lang={lang} setLang={setLang} app="seeker" />;
}
