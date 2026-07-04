"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { SPECIES, compressImage } from "../../lib/constants";

function UploadInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoBlob, setPhotoBlob] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  const [species, setSpecies] = useState("");
  const [rating, setRating] = useState(0);
  const [caption, setCaption] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [dateCaught, setDateCaught] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [location, setLocation] = useState("");
  const [released, setReleased] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!editId) return;

    supabase
      .from("catches")
      .select("*")
      .eq("id", editId)
      .single()
      .then(({ data }) => {
        if (!data) return;

        setExistingPhotoUrl(data.photo_url);
        setSpecies(data.species);
        setRating(data.rating);
        setCaption(data.caption || "");
        setWeight(data.weight || "");
        setLength(data.length || "");
        setDateCaught(data.date_caught);
        setLocation(data.location || "");
        setReleased(data.released);
        setIsPublic(data.is_public);
      });
  }, [editId]);

  async function handlePhotoPick(e) {
    const file = e.target.files[0];
    if (!file) return;

    const blob = await compressImage(file, 1000);
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
  }

  async function handleSubmit() {
    if (!photoBlob && !existingPhotoUrl) {
      setErr("Add a photo of your catch.");
      return;
    }
    if (!species) {
      setErr("Select a species.");
      return;
    }
    if (!rating) {
      setErr("Rate how memorable it was.");
      return;
    }
    if (!dateCaught) {
      setErr("Add the date you caught it.");
      return;
    }

    setErr("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let photoUrl = existingPhotoUrl;

    if (photoBlob) {
      const path = `catches/${user.id}-${Date.now()}.jpg`;

      await supabase.storage
        .from("photos")
        .upload(path, photoBlob, { contentType: "image/jpeg" });

      photoUrl = supabase.storage
        .from("photos")
        .getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      species,
      caption,
      rating,
      weight: weight || null,
      length: length || null,
      location,
      date_caught: dateCaught,
      released,
      is_public: isPublic,
      photo_url: photoUrl,
    };

    if (editId) {
      const { error } = await supabase
        .from("catches")
        .update(payload)
        .eq("id", editId);

      if (error) {
        setErr(error.message);
        return;
      }

      router.push(`/catch/${editId}`);
    } else {
      const { data, error } = await supabase
        .from("catches")
        .insert({ ...payload, owner_id: user.id })
        .select()
        .single();

      if (error) {
        setErr(error.message);
        return;
      }

      router.push(`/catch/${data.id}`);
    }
  }

  const photoSrc = photoPreview || existingPhotoUrl;

  return (
    <div>
      <div className="back-row">
        <button className="back-btn" onClick={() => router.back()}>
          ←
        </button>
        <h3>{editId ? "Edit catch" : "Log a catch"}</h3>
      </div>

      <div className="content-pad">
        <label className="upload-photo-box">
          {photoSrc ? (
            <img src={photoSrc} alt="" />
          ) : (
            <>
              <div>📸</div>
              <div>Tap to add a photo</div>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoPick}
          />
        </label>

        <div className="field">
          <label>Species</label>
          <select value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="">Select species</option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>How memorable was this catch?</label>
          <div className="star-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={n <= rating ? "on" : ""}
                onClick={() => setRating(n)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="two-col">
          <div className="field">
            <label>Weight</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Length</label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Date caught</label>
          <input
            type="date"
            value={dateCaught}
            onChange={(e) => setDateCaught(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {err && <div className="err">{err}</div>}

        <button className="btn btn-primary" onClick={handleSubmit}>
          {editId ? "Save changes" : "Post catch"}
        </button>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadInner />
    </Suspense>
  );
}