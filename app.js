const API_BASE = "https://dj-website-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

  loadSongs();

  setupNavigation();

  setupBooking();

  setupSongUpdates();

});


/* ==========================================
   LOAD SONGS
   ========================================== */

let isLoadingSongs = false;

async function loadSongs() {

  const container =
    document.getElementById("track-list");

  if (!container) {
    console.error("track-list not found");
    return;
  }

  if (isLoadingSongs) {
    return;
  }

  isLoadingSongs = true;

  try {

    const response =
      await fetch(
        `${API_BASE}/api/songs`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    console.log(
      "Songs API status:",
      response.status
    );

    if (!response.ok) {

      throw new Error(
        "API returned " + response.status
      );

    }

    const songs =
      await response.json();

    console.log(
      "Songs received:",
      songs
    );

    container.innerHTML = "";

    if (
      !Array.isArray(songs) ||
      songs.length === 0
    ) {

      container.innerHTML = `
        <div class="songs-empty">
          <div class="empty-icon">🎵</div>
          <div>No songs available yet.</div>
        </div>
      `;

      return;
    }


    songs.forEach(song => {

      createSongCard(
        container,
        song
      );

    });

  }

  catch (error) {

    console.error(
      "SONG LOAD ERROR:",
      error
    );

    container.innerHTML = `
      <div class="songs-error">
        <div class="error-icon">⚠</div>
        <div>Unable to load songs.</div>
        <small>
          Please refresh the page.
        </small>
      </div>
    `;

  }

  finally {

    isLoadingSongs = false;

  }

}


/* ==========================================
   CREATE SONG CARD
   ========================================== */

function createSongCard(
  container,
  song
) {

  const card =
    document.createElement("div");

  card.className =
    "song-card";


  /* ----------------------------------------
     COVER
     ---------------------------------------- */

  const coverWrapper =
    document.createElement("div");

  coverWrapper.className =
    "song-cover-wrapper";


  if (song.cover_image) {

    const cover =
      document.createElement("img");

    cover.className =
      "song-cover";

    cover.src =
      getBackendUrl(song.cover_image);

    cover.alt =
      (song.title || "Song") + " cover";

    cover.loading =
      "lazy";

    coverWrapper.appendChild(
      cover
    );

  }

  else {

    coverWrapper.innerHTML = `
      <div class="song-cover-placeholder">
        🎵
      </div>
    `;

  }


  /* ----------------------------------------
     SONG DETAILS
     ---------------------------------------- */

  const details =
    document.createElement("div");

  details.className =
    "song-details";


  const title =
    document.createElement("div");

  title.className =
    "song-title";

  title.textContent =
    song.title || "Untitled Song";


  const genre =
    document.createElement("div");

  genre.className =
    "song-genre";

  genre.textContent =
    song.genre || "DJ Sourabh";


  details.appendChild(
    title
  );

  details.appendChild(
    genre
  );


  /* ----------------------------------------
     PLAY BUTTON
     ---------------------------------------- */

  const playButton =
    document.createElement("button");

  playButton.type =
    "button";

  playButton.className =
    "song-play-button";

  playButton.innerHTML = `
    <span class="play-icon">▶</span>
    <span>PLAY</span>
  `;


  playButton.addEventListener(
    "click",
    () => {

      playTrack(
        song.title,
        song.audio_file
      );

    }
  );


  /* ----------------------------------------
     CARD ASSEMBLY
     ---------------------------------------- */

  card.appendChild(
    coverWrapper
  );

  card.appendChild(
    details
  );

  card.appendChild(
    playButton
  );

  container.appendChild(
    card
  );

}


/* ==========================================
   BACKEND URL
   ========================================== */

function getBackendUrl(filePath) {

  if (!filePath) {
    return "";
  }

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {

    return filePath;

  }

  return API_BASE + filePath;

}


/* ==========================================
   PLAY SONG
   ========================================== */

function playTrack(
  title,
  audioSrc
) {

  const audio =
    document.getElementById(
      "audio-element"
    );

  const player =
    document.getElementById(
      "player-bar"
    );

  const playingTitle =
    document.getElementById(
      "playing-title"
    );


  if (!audio) {

    console.error(
      "Audio element not found"
    );

    return;

  }


  if (!audioSrc) {

    console.error(
      "Audio file missing"
    );

    return;

  }


  if (playingTitle) {

    playingTitle.textContent =
      title || "Playing Track";

  }


  audio.src =
    getBackendUrl(audioSrc);

  audio.load();


  if (player) {

    player.classList.remove(
      "hidden"
    );

  }


  audio.play()
    .catch(error => {

      console.error(
        "Audio playback error:",
        error
      );

    });

}


/* ==========================================
   NAVIGATION
   ========================================== */

function setupNavigation() {

  const sidebar =
    document.getElementById(
      "sidebar"
    );

  const overlay =
    document.getElementById(
      "sidebar-overlay"
    );

  const menuButton =
    document.getElementById(
      "menu-toggle"
    );

  const closeButton =
    document.getElementById(
      "close-sidebar"
    );

  const navItems =
    document.querySelectorAll(
      ".nav-item"
    );


  function openMenu() {

    sidebar?.classList.remove(
      "hidden"
    );

    overlay?.classList.remove(
      "hidden"
    );

  }


  function closeMenu() {

    sidebar?.classList.add(
      "hidden"
    );

    overlay?.classList.add(
      "hidden"
    );

  }


  menuButton?.addEventListener(
    "click",
    openMenu
  );

  closeButton?.addEventListener(
    "click",
    closeMenu
  );

  overlay?.addEventListener(
    "click",
    closeMenu
  );


  navItems.forEach(item => {

    item.addEventListener(
      "click",
      closeMenu
    );

  });

}


/* ==========================================
   BOOKING
   ========================================== */

function setupBooking() {

  const modal =
    document.getElementById(
      "booking-modal"
    );

  const openButton =
    document.getElementById(
      "open-booking-btn"
    );

  const closeButton =
    document.getElementById(
      "close-modal"
    );

  const form =
    document.getElementById(
      "booking-form"
    );

  const status =
    document.getElementById(
      "booking-status"
    );


  /* ----------------------------------------
     OPEN BOOKING MODAL
     ---------------------------------------- */

  openButton?.addEventListener(
    "click",
    () => {

      modal?.classList.remove(
        "hidden"
      );

    }
  );


  /* ----------------------------------------
     CLOSE BOOKING MODAL
     ---------------------------------------- */

  closeButton?.addEventListener(
    "click",
    () => {

      modal?.classList.add(
        "hidden"
      );

    }
  );


  /* ----------------------------------------
     SUBMIT BOOKING
     ---------------------------------------- */

  form?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      /* --------------------------------------
         GET FORM VALUES
         -------------------------------------- */

      const mandalInput =
        document.getElementById(
          "mandal-name"
        );

      const nameInput =
        document.getElementById(
          "client-name"
        );

      const phoneInput =
        document.getElementById(
          "client-phone"
        );

      const detailsInput =
        document.getElementById(
          "song-details"
        );


      const booking = {

        mandal:
          mandalInput?.value.trim() || "",

        name:
          nameInput?.value.trim() || "",

        phone:
          phoneInput?.value.trim() || "",

        details:
          detailsInput?.value.trim() || "N/A"

      };


      /* --------------------------------------
         VALIDATION
         -------------------------------------- */

      if (
        !booking.name ||
        !booking.phone
      ) {

        if (status) {

          status.textContent =
            "Please enter your name and phone number.";

        }

        return;

      }


      /* --------------------------------------
         SHOW SUBMITTING
         -------------------------------------- */

      if (status) {

        status.textContent =
          "Submitting booking request...";

      }


      /* --------------------------------------
         SEND TO SERVER
         -------------------------------------- */

      try {

        const response =
          await fetch(
            `${API_BASE}/api/bookings`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(
                  booking
                )
            }
          );


        console.log(
          "Booking API status:",
          response.status
        );


        const result =
          await response.json();


        console.log(
          "Booking API response:",
          result
        );


        /* ------------------------------------
           CHECK SERVER RESPONSE
           ------------------------------------ */

        if (!response.ok) {

          throw new Error(
            result.message ||
            "Booking submission failed"
          );

        }


        /* ------------------------------------
           SUCCESS
           ------------------------------------ */

        if (status) {

          status.textContent =
            "Booking request submitted successfully!";

        }


        /* ------------------------------------
           RESET FORM & CLOSE MODAL
           ------------------------------------ */

        setTimeout(() => {

          form.reset();

          if (status) {
            status.textContent = "";
          }

          modal?.classList.add(
            "hidden"
          );

        }, 1500);


      }

      catch (error) {

        console.error(
          "BOOKING SUBMIT ERROR:",
          error
        );


        if (status) {

          status.textContent =
            "Unable to submit booking. Please try again.";

        }

      }

    }
  );

}


/* ==========================================
   SONG UPDATE DETECTION
   ========================================== */

function setupSongUpdates() {

  try {

    const channel =
      new BroadcastChannel(
        "dj-songs"
      );


    channel.onmessage =
      event => {

        if (
          event.data?.type ===
          "songs-updated"
        ) {

          loadSongs();

        }

      };

  }

  catch (error) {

    console.log(
      "BroadcastChannel unavailable"
    );

  }


  window.addEventListener(
    "storage",
    event => {

      if (
        event.key ===
        "dj_songs_updated"
      ) {

        loadSongs();

      }

    }
  );


  /*
     Check for new songs every 5 seconds.
     Prevents multiple requests running together.
  */

  setInterval(
    loadSongs,
    5000
  );

}
