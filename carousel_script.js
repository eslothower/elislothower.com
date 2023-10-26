let slideInterval;

document.addEventListener('DOMContentLoaded', function () {
   document.querySelectorAll(".carousel-container .slider img").forEach(img => {
      img.addEventListener('click', (e) => {
         moveCarouselToImage(e.target);
      });
   });

   document.addEventListener("click", e => {
      let handle;
      if (e.target.matches(".handle")) {
         handle = e.target;
      } else {
         handle = e.target.closest(".handle");
      }
      if (handle) {
         onHandleClick(handle);
      }
   });

   const throttleProgressBar = throttle(() => {
      document.querySelectorAll(".progress-bar").forEach(calculateProgressBar);
   }, 250);
   window.addEventListener("resize", throttleProgressBar);

   document.querySelectorAll(".progress-bar").forEach(calculateProgressBar);

   // Start the auto slide once the DOM is ready
   startAutoSlide();
});

function moveCarouselToImage(image) {
   const slider = image.closest('.slider');
   const images = Array.from(slider.querySelectorAll('img'));
   const clickedImageIndex = images.indexOf(image);

   if (clickedImageIndex !== -1) {
      slider.style.setProperty('--slider-index', clickedImageIndex);

      const progressBar = slider.closest(".row").querySelector(".progress-bar");
      safelyUpdateClass(progressBar, clickedImageIndex, clickedImageIndex);
   }
}

function calculateProgressBar(progressBar) {
   progressBar.innerHTML = "";
   const slider = progressBar.closest(".row").querySelector(".slider");
   const itemCount = slider.children.length;
   const itemsPerScreen = parseInt(getComputedStyle(slider).getPropertyValue("--items-per-screen"));
   let sliderIndex = parseInt(getComputedStyle(slider).getPropertyValue("--slider-index"));
   const progressBarItemCount = Math.ceil(itemCount / itemsPerScreen);

   if (sliderIndex >= progressBarItemCount) {
      slider.style.setProperty("--slider-index", progressBarItemCount - 1);
      sliderIndex = progressBarItemCount - 1;
   }

   for (let i = 0; i < progressBarItemCount; i++) {
      const barItem = document.createElement("div");
      barItem.classList.add("progress-item");
      if (i === sliderIndex) {
         barItem.classList.add("active");
      }
      progressBar.append(barItem);
   }
}

function onHandleClick(handle) {
   const progressBar = handle.closest(".row").querySelector(".progress-bar");
   const slider = handle.closest(".carousel-container").querySelector(".slider");
   const sliderIndex = parseInt(getComputedStyle(slider).getPropertyValue("--slider-index"));
   const totalImages = slider.children.length;
   const itemsPerScreen = parseInt(getComputedStyle(slider).getPropertyValue("--items-per-screen"));

   if (handle.classList.contains("right-handle")) {
      if (sliderIndex + itemsPerScreen >= totalImages) {
         slider.style.setProperty("--slider-index", 0);
         safelyUpdateClass(progressBar, sliderIndex, 0);
      } else {
         slider.style.setProperty("--slider-index", sliderIndex + 1);
         safelyUpdateClass(progressBar, sliderIndex, sliderIndex + 1);
      }
   }

   if (handle.classList.contains("left-handle")) {
      if (sliderIndex - 1 < 0) {
         slider.style.setProperty("--slider-index", totalImages - itemsPerScreen);
         safelyUpdateClass(progressBar, sliderIndex, totalImages - itemsPerScreen);
      } else {
         slider.style.setProperty("--slider-index", sliderIndex - 1);
         safelyUpdateClass(progressBar, sliderIndex, sliderIndex - 1);
      }
   }
}

function safelyUpdateClass(progressBar, oldIndex, newIndex) {
   if (oldIndex >= 0 && oldIndex < progressBar.children.length) {
      progressBar.children[oldIndex].classList.remove("active");
   }
   if (newIndex >= 0 && newIndex < progressBar.children.length) {
      progressBar.children[newIndex].classList.add("active");
   }
}

function throttle(cb, delay = 1000) {
   let shouldWait = false;
   let waitingArgs;
   const timeoutFunc = () => {
      if (waitingArgs == null) {
         shouldWait = false;
      } else {
         cb(...waitingArgs);
         waitingArgs = null;
         setTimeout(timeoutFunc, delay);
      }
   };

   return (...args) => {
      if (shouldWait) {
         waitingArgs = args;
         return;
      }

      cb(...args);
      shouldWait = true;
      setTimeout(timeoutFunc, delay);
   };
}

function startAutoSlide() {
   const slideDuration = 4000;
   slideInterval = setInterval(() => {
      const carousels = document.querySelectorAll('.carousel-container');
      carousels.forEach(carousel => {
         const rightHandle = carousel.querySelector('.right-handle');
         if (rightHandle) {
            onHandleClick(rightHandle);
         }
      });
   }, slideDuration);
}