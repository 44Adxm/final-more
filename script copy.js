const heroVideo = document.getElementById("hero-video");
const welcomeScreen = document.getElementById("welcome-screen");
const welcomeVideo = document.getElementById("welcome-video");
const welcomeLogo = document.getElementById("intro-logo");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function primeInlineVideo(video, { loop = false } = {}) {
  if (!video) {
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = loop;
  video.autoplay = true;
  video.setAttribute("muted", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "true");
}

function attemptVideoPlayback(video, { loop = false, onBlocked } = {}) {
  if (!video) {
    return Promise.resolve(false);
  }

  primeInlineVideo(video, { loop });

  const playAttempt = video.play();
  if (!playAttempt || typeof playAttempt.then !== "function") {
    return Promise.resolve(true);
  }

  return playAttempt
    .then(() => true)
    .catch((error) => {
      if (typeof onBlocked === "function") {
        onBlocked(error);
      }
      return false;
    });
}

function retryVideoPlaybackOnInteraction(video, options = {}) {
  if (!video) {
    return;
  }

  let retried = false;
  const retry = () => {
    if (retried) {
      return;
    }

    retried = true;
    attemptVideoPlayback(video, options);
    window.removeEventListener("touchstart", retry);
    window.removeEventListener("pointerdown", retry);
  };

  window.addEventListener("touchstart", retry, { once: true, passive: true });
  window.addEventListener("pointerdown", retry, { once: true, passive: true });
}

function setupWelcomeScreen() {
  if (!welcomeScreen || !welcomeLogo) {
    return;
  }

  if (window.__mtsWelcomeStarted) {
    return;
  }

  window.__mtsWelcomeStarted = true;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const shouldSkipWelcomeVideo = false;
  const navLogoShell = document.querySelector(".nav-logo-shell");
  const mainNav = document.getElementById("main-nav");
  const mobileNav = document.getElementById("main-nav-mobile");
  const desktopNavSides = document.querySelectorAll(".nav-side");

  function finishWelcomeScreen() {
    if (welcomeScreen.classList.contains("is-hiding")) {
      return;
    }

    welcomeScreen.classList.add("is-hiding");

    window.setTimeout(() => {
      welcomeScreen.style.display = "none";
      document.body.classList.remove("welcome-active");
      document.body.style.overflow = "auto";
      document.body.style.height = "auto";
      welcomeLogo.classList.add("is-final");

      if (navLogoShell) {
        navLogoShell.style.display = "none";
      }
    }, 1000);
  }

  if (prefersReducedMotion) {
    welcomeLogo.style.left = "50%";
    welcomeLogo.style.top = isMobile ? "20px" : "18px";
    welcomeLogo.style.width = isMobile ? "110px" : "138px";
    welcomeLogo.style.opacity = "1";
    welcomeLogo.style.filter = "blur(0px)";
    welcomeLogo.style.transform = isMobile ? "translateX(-50%) scale(0.5)" : "translateX(-50%) scale(1.02)";
    welcomeLogo.classList.add("is-final");
    if (isMobile && mobileNav) {
      mobileNav.style.opacity = "1";
    }
    if (!isMobile && mainNav) {
      mainNav.style.opacity = "1";
    }
    finishWelcomeScreen();
    return;
  }

  if (!window.gsap) {
    window.setTimeout(finishWelcomeScreen, 2600);
    return;
  }

  if (welcomeVideo && !shouldSkipWelcomeVideo) {
    attemptVideoPlayback(welcomeVideo, {
      loop: false,
      onBlocked: () => {
        retryVideoPlaybackOnInteraction(welcomeVideo, { loop: false });
        window.setTimeout(runWelcomeTimeline, 500);
      },
    });
  }

  if (navLogoShell) {
    gsap.set(navLogoShell, { autoAlpha: 0 });
  }
  if (mainNav) {
    gsap.set(mainNav, { autoAlpha: 0 });
  }
  if (mobileNav) {
    gsap.set(mobileNav, { autoAlpha: 0 });
  }
  if (!isMobile && desktopNavSides.length) {
    gsap.set(desktopNavSides, { autoAlpha: 0, y: 6 });
  }

  gsap.set(welcomeLogo, {
    opacity: 0,
    filter: "blur(15px)",
    left: "50%",
    top: "50%",
    xPercent: -50,
    yPercent: -50,
    width: isMobile ? "min(82vw, 13rem)" : "min(24vw, 11rem)",
    transformOrigin: "center top",
    scale: 1,
  });

  let timelineStarted = false;

  function runWelcomeTimeline() {
    if (timelineStarted) {
      return;
    }

    timelineStarted = true;

    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        gsap.set(welcomeLogo, { opacity: 1, filter: "blur(0px)" });
        finishWelcomeScreen();
      },
    });

    timeline.to(
      welcomeLogo,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1,
      },
      1
    );

    if (welcomeVideo && !shouldSkipWelcomeVideo) {
      timeline.to(
        welcomeVideo,
        {
          opacity: 0,
          duration: 0.9,
        },
        ">0.15"
      );
    }

    timeline
      .to(
        welcomeLogo,
        isMobile
          ? {
              top: "20px",
              left: "50%",
              xPercent: -50,
              yPercent: 0,
              scale: 0.5,
              duration: 1,
              ease: "power3.inOut",
            }
          : {
              top: "18px",
              left: "50%",
              xPercent: -50,
              yPercent: 0,
              scale: 1.02,
              duration: 1,
              ease: "power3.inOut",
            },
        "<0.05"
      )
      .set(
        welcomeLogo,
        {
          opacity: 1,
          filter: "blur(0px)",
        },
        ">"
      );

    if (isMobile) {
      timeline.to(
        mobileNav,
        {
          autoAlpha: 1,
          duration: 0.9,
          ease: "power2.out",
        },
        "<0.05"
      );
    } else {
      timeline
        .to(
          mainNav,
          {
            autoAlpha: 1,
            duration: 0.7,
            ease: "power2.out",
          },
          "<0.05"
        )
        .to(
          desktopNavSides,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.04,
            ease: "power2.out",
          },
          "<"
        );
    }

    timeline.to(
      welcomeScreen,
      {
        opacity: 0,
        duration: 0.55,
      },
      "<0.1"
    );
  }

  if (welcomeVideo && !shouldSkipWelcomeVideo) {
    welcomeVideo.addEventListener("loadedmetadata", runWelcomeTimeline, { once: true });
    welcomeVideo.addEventListener("loadeddata", runWelcomeTimeline, { once: true });
    welcomeVideo.addEventListener("canplay", runWelcomeTimeline, { once: true });
    welcomeVideo.addEventListener(
      "error",
      () => {
        window.setTimeout(runWelcomeTimeline, 150);
      },
      { once: true }
    );

    if (welcomeVideo.readyState >= 2) {
      runWelcomeTimeline();
    }

    window.setTimeout(runWelcomeTimeline, 3200);
  } else {
    if (welcomeVideo) {
      welcomeVideo.pause();
      welcomeVideo.removeAttribute("src");
      const sourceNodes = welcomeVideo.querySelectorAll("source");
      sourceNodes.forEach((source) => source.removeAttribute("src"));
      welcomeVideo.load();
    }
    runWelcomeTimeline();
  }
}

function setupLuxuryMotion() {
  if (heroVideo) {
    attemptVideoPlayback(heroVideo, {
      loop: true,
      onBlocked: () => {
        retryVideoPlaybackOnInteraction(heroVideo, { loop: true });
      },
    });
  }

  if (!window.gsap) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const navShell = document.querySelector(".nav-logo-shell");
  const navLinks = document.querySelector(".nav-links");
  const heroCopy = document.querySelector(".hero-copy-block");
  const heroActions = document.querySelector(".hero-actions");
  const heroGlow = document.querySelector(".hero-smoke-glow");
  const heroGradient = document.querySelector(".hero-video-gradient");

  if (prefersReducedMotion) {
    gsap.set([navLinks, heroCopy, heroActions, ".glass-card"], { opacity: 1, y: 0 });
    if (heroVideo) {
      gsap.set(heroVideo, { opacity: 1, scale: 1.08 });
    }
    if (navShell) {
      gsap.set(navShell, { autoAlpha: 0 });
    }
    return;
  }

  if (navShell) {
    gsap.set(navShell, { autoAlpha: 0 });
  }
  gsap.set(navLinks, { opacity: 1, y: 0 });
  gsap.set([heroCopy, heroActions, ".glass-card"], { opacity: 1, y: 0 });
  gsap.set(heroGlow, { opacity: 0.18, scale: 1, transformOrigin: "center center" });
  gsap.set(heroGradient, { opacity: 0.35 });
  if (heroVideo) {
    gsap.set(heroVideo, { opacity: 1, scale: 1.08 });
  }

  if (heroVideo) {
    gsap.to(heroVideo, {
      yPercent: 6,
      scale: 1.12,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  gsap.to(heroGlow, {
    yPercent: -12,
    opacity: 0.32,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  gsap.utils.toArray(".reveal").forEach((element) => {
    gsap.to(element, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 84%",
      },
    });
  });

  gsap.to(".watermark", {
    x: -16,
    opacity: 0.18,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });
}

function setupPremiumReveal() {
  const revealGroups = document.querySelectorAll(".luxury-reveal-group");

  if (!revealGroups.length) {
    return;
  }

  const revealGroup = (group) => {
    group.querySelectorAll(".luxury-reveal-item").forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${index * 200}ms`);
      item.classList.add("is-revealed");
    });
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealGroups.forEach(revealGroup);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        revealGroup(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -20% 0px",
      threshold: 0.01,
    }
  );

  revealGroups.forEach((group) => observer.observe(group));
}

function setupGalleryTouchStates() {
  if (!window.matchMedia("(hover: none)").matches) {
    return;
  }

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("is-active");
    });
  });
}

window.addEventListener("load", () => {
  setupWelcomeScreen();
  setupLuxuryMotion();
  setupPremiumReveal();
  setupGalleryTouchStates();
});
