document.addEventListener("DOMContentLoaded", function() {
  // Initialize pdfjsLib
  if (typeof pdfjsLib === 'undefined') {
    console.error("pdfjsLib is not defined. Ensure pdf.worker.js is loaded.");
    return;
  }

  // Navigation menu functionality
  const menuButton = document.getElementById("menuButton");
  const menuOptions = document.getElementById("menuOptions");

  menuButton.addEventListener("click", function() {
    menuOptions.style.display = menuOptions.style.display === "block" ? "none" : "block";
  });

  // Close menu when clicking outside
  document.addEventListener("click", function(event) {
    if (!menuButton.contains(event.target) && !menuOptions.contains(event.target)) {
      menuOptions.style.display = "none";
    }
  });

  // File upload and generate functionality
  const fileInput = document.getElementById("fileInput");
  const generateButton = document.getElementById("generateButton");
  const uploadForm = document.getElementById("uploadForm");

  if (uploadForm && fileInput && generateButton) {
    // Add loading state management
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerText = 'Processing...';
    loadingSpinner.style.display = 'none';
    document.body.appendChild(loadingSpinner);

    function setLoadingState(isLoading) {
      generateButton.disabled = isLoading;
      loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }

    uploadForm.addEventListener("submit", async function(event) {
      event.preventDefault();
      const file = fileInput.files[0];
      
      if (file) {
        setLoadingState(true);
        try {
          await processPDF(file);
          // Clear file input only after successful processing
          fileInput.value = "";
        } catch (error) {
          console.error("Error processing PDF:", error);
          alert("An error occurred while processing the PDF. Please try again.");
        } finally {
          setLoadingState(false);
        }
      } else {
        alert("Please select a file to upload.");
      }
    });

    generateButton.addEventListener("click", function(event) {
      event.preventDefault();
      uploadForm.dispatchEvent(new Event('submit'));
    });
  }

  // PDF processing function
  async function processPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function(event) {
        try {
          console.log("Starting PDF processing...");
          const pdfData = new Uint8Array(event.target.result);
          console.log("PDF data loaded, initializing document...");
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          console.log("PDF document initialized, extracting text...");
          let fullText = '';

          // Extract text from all pages
          for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`Processing page ${i} of ${pdf.numPages}`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ');
          }

          console.log("Text extraction complete, chunking content...");
          const chunks = chunkText(fullText);
          console.log("Storing flashcard content in localStorage...");
          localStorage.setItem('flashcardContent', JSON.stringify(chunks));
          console.log("Redirecting to flashcards.html...");
          window.location.href = "flashcards.html";
          resolve();
        } catch (error) {
          console.error("Error in processPDF:", error);
          reject(error);
        }
      };
      reader.onerror = function(error) {
        console.error("FileReader error:", error);
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Function to chunk text into short notes
  function chunkText(text) {
    const sentences = text.split(/[.!?]/).filter(s => s.trim() !== '');
    const chunks = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
      if ((currentChunk + sentence).length <= 400) {
        currentChunk += sentence + '. ';
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + '. ';
      }
    });

    if (currentChunk.trim() !== '') {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // Flashcard functionality
  const flashcardsContainer = document.querySelector(".flashcards-container");
  if (flashcardsContainer) {
    const chunks = JSON.parse(localStorage.getItem('flashcardContent') || '[]');
    if (chunks.length > 0) {
      flashcardsContainer.innerHTML = chunks.map((chunk, index) => `
        <div class="flashcard">
          <h3>Note ${index + 1}</h3>
          <p>${chunk}</p>
        </div>
      `).join('');
    }

    // Endless scroll functionality
    const flashcards = document.querySelectorAll(".flashcard");
    let currentFlashcardIndex = 0;

    flashcards.forEach((flashcard, index) => {
      flashcard.style.display = index === 0 ? "block" : "none";
    });

    flashcardsContainer.addEventListener("scroll", function() {
      const { scrollTop, scrollHeight, clientHeight } = flashcardsContainer;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcards.length;
        flashcards[currentFlashcardIndex].style.display = "block";
        flashcardsContainer.scrollTop = 0;
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", function(event) {
      if (event.key === "ArrowDown") {
        currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcards.length;
        flashcards.forEach((flashcard, index) => {
          flashcard.style.display = index === currentFlashcardIndex ? "block" : "none";
        });
      }
    });
  }
});
