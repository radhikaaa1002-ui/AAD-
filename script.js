const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const barsContainer = $("#bars");
const sizeInput = $("#arraySize");
const sizeValue = $("#sizeValue");
const algorithmSelect = $("#algorithm");
const speedSelect = $("#speed");
const comparisonsDisplay = $("#comparisons");
const lengthDisplay = $("#arrayLength");
const statusDisplay = $("#sortStatus");
const messageDisplay = $("#visualMessage");

let originalArray = [];
let array = [];
let running = false;
let runId = 0;
let comparisons = 0;
let toastTimer;

// ---------------- TOAST NOTIFICATION ----------------

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// ---------------- SORTING VISUALIZER ----------------

function generateArray() {
  runId++;
  running = false;
  comparisons = 0;

  originalArray = Array.from(
    { length: Number(sizeInput.value) },
    () => Math.floor(Math.random() * 90) + 10
  );

  array = [...originalArray];

  comparisonsDisplay.textContent = "0";
  lengthDisplay.textContent = array.length;
  statusDisplay.textContent = "Ready";
  statusDisplay.className = "status-ready";
  messageDisplay.textContent = "New array generated. Start sorting to see the magic!";

  renderBars();
  updateControls();
}

function renderBars(highlights = [], sortedIndices = []) {
  const fragment = document.createDocumentFragment();
  const max = Math.max(...array, 1);

  array.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${(value / max) * 100}%`;
    bar.title = `Value: ${value}`;

    if (sortedIndices.includes(index)) {
      bar.classList.add("sorted");
    }

    if (highlights.includes(index)) {
      bar.classList.remove("sorted");
      bar.classList.add("comparing");
    }

    fragment.appendChild(bar);
  });

  barsContainer.replaceChildren(fragment);
}

function delay(ms, id) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(id === runId), ms);
  });
}

function updateControls() {
  $("#generateBtn").disabled = running;
  $("#sortBtn").disabled = running;
  $("#resetBtn").disabled = running;
  algorithmSelect.disabled = running;
  sizeInput.disabled = running;
  speedSelect.disabled = running;

  $("#sortBtn").textContent = running
    ? "Sorting..."
    : "▶ Start Sorting";
}

async function compareAndRender(i, j, id) {
  if (id !== runId) return false;

  comparisons++;
  comparisonsDisplay.textContent = comparisons;
  renderBars([i, j]);

  return delay(Number(speedSelect.value), id);
}

// ---------------- BUBBLE SORT ----------------

async function bubbleSort(id) {
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (!(await compareAndRender(j, j + 1, id))) return false;

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        renderBars([j, j + 1]);
        if (!(await delay(Number(speedSelect.value), id))) return false;
      }
    }
  }

  return id === runId;
}

// ---------------- SELECTION SORT ----------------

async function selectionSort(id) {
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;

    for (let j = i + 1; j < n; j++) {
      if (!(await compareAndRender(minIndex, j, id))) return false;

      if (array[j] < array[minIndex]) {
        minIndex = j;
      }
    }

    if (minIndex !== i) {
      [array[i], array[minIndex]] = [array[minIndex], array[i]];
      renderBars([i, minIndex]);
      if (!(await delay(Number(speedSelect.value), id))) return false;
    }
  }

  return id === runId;
}

// ---------------- INSERTION SORT ----------------

async function insertionSort(id) {
  for (let i = 1; i < array.length; i++) {
    const key = array[i];
    let j = i - 1;

    while (j >= 0) {
      if (!(await compareAndRender(j, j + 1, id))) return false;

      if (array[j] <= key) break;

      array[j + 1] = array[j];
      j--;

      renderBars([j + 1, j + 2]);
      if (!(await delay(Number(speedSelect.value), id))) return false;
    }

    array[j + 1] = key;
    renderBars([j + 1]);

    if (!(await delay(Number(speedSelect.value), id))) return false;
  }

  return id === runId;
}

// ---------------- START SORTING ----------------

async function startSorting() {
  if (running) return;

  running = true;
  const id = ++runId;

  statusDisplay.textContent = "Running";
  statusDisplay.className = "status-ready";
  messageDisplay.textContent = "Algorithm in progress... watch the comparisons!";
  updateControls();

  let completed = false;

  try {
    const selectedAlgorithm = algorithmSelect.value;

    if (selectedAlgorithm === "bubble") {
      completed = await bubbleSort(id);
    } else if (selectedAlgorithm === "selection") {
      completed = await selectionSort(id);
    } else {
      completed = await insertionSort(id);
    }
  } catch (error) {
    console.error("Sorting error:", error);
    if (id === runId) {
      messageDisplay.textContent = "An error occurred. Please generate a new array.";
    }
  }

  // Ignore an older sorting task if a newer task has started.
  if (id !== runId) return;

  running = false;
  updateControls();

  if (completed) {
    renderBars([], array.map((_, index) => index));
    statusDisplay.textContent = "Completed";
    statusDisplay.className = "";
    statusDisplay.style.color = "#56f5bb";
    messageDisplay.textContent =
      `Array sorted successfully! Total comparisons: ${comparisons}.`;
  }
}

// ---------------- BUTTON EVENTS ----------------

$("#generateBtn").addEventListener("click", generateArray);

$("#sortBtn").addEventListener("click", startSorting);

$("#resetBtn").addEventListener("click", () => {
  if (running) return;

  array = [...originalArray];
  comparisons = 0;

  comparisonsDisplay.textContent = "0";
  statusDisplay.textContent = "Ready";
  statusDisplay.style.color = "";
  statusDisplay.className = "status-ready";
  messageDisplay.textContent = "Array reset to its original order.";

  renderBars();
});

sizeInput.addEventListener("input", () => {
  sizeValue.textContent = sizeInput.value;
  generateArray();
});

algorithmSelect.addEventListener("change", () => {
  const names = {
    bubble: "Bubble Sort",
    selection: "Selection Sort",
    insertion: "Insertion Sort"
  };

  messageDisplay.textContent =
    `${names[algorithmSelect.value]} selected. Ready to run!`;
});

// ---------------- ALGORITHM INFORMATION CARDS ----------------

const algorithmInfo = {
  bubble: {
    title: "Bubble Sort",
    detail: "Repeatedly compares adjacent values and swaps them when necessary. Best case: O(n) with an early-exit optimization; average and worst case: O(n²)."
  },
  binary: {
    title: "Binary Search",
    detail: "Searches sorted data by halving the search interval. Time complexity: O(log n). It requires sorted input."
  },
  merge: {
    title: "Merge Sort",
    detail: "Divides an array into smaller parts and merges them in sorted order. Time complexity: O(n log n); auxiliary space: O(n) for typical array implementations."
  },
  graph: {
    title: "Graph Traversal",
    detail: "BFS explores a graph level by level using a queue. DFS explores deeper paths using recursion or a stack. With adjacency lists, both typically take O(V + E) time."
  }
};

$$("[data-algo]").forEach((button) => {
  button.addEventListener("click", () => {
    const info = algorithmInfo[button.dataset.algo];
    showToast(`${info.title}: ${info.detail}`);
  });
});

// ---------------- BIG O COMPLEXITY EXPLORER ----------------

const complexityData = {
  n1: {
    title: "O(1) — Constant",
    color: "#56f5bb",
    values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    description: "Constant-time operations take roughly the same amount of work as the input grows. Example: accessing an array element by index."
  },
  logn: {
    title: "O(log n) — Logarithmic",
    color: "#42e8f5",
    values: [1, 2.2, 2.9, 3.4, 3.8, 4.2, 4.5, 4.8, 5, 5.2],
    description: "The workload grows slowly as input increases. Binary search is a classic example because it halves the search interval at each step."
  },
  n: {
    title: "O(n) — Linear",
    color: "#a78bfa",
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    description: "Work grows in proportion to input size. Example: scanning an array once to find its maximum value."
  },
  nlogn: {
    title: "O(n log n) — Linearithmic",
    color: "#ffc27a",
    values: [0.3, 0.8, 1.5, 2.3, 3.2, 4.2, 5.3, 6.5, 7.8, 9.2],
    description: "Work grows faster than linear but much more slowly than quadratic. Merge Sort typically takes O(n log n) time."
  },
  n2: {
    title: "O(n²) — Quadratic",
    color: "#ff718c",
    values: [0.1, 0.2, 0.4, 0.8, 1.2, 1.9, 2.9, 4.4, 6.6, 10],
    description: "Work can grow approximately with the square of input size. Nested loops over the same input are a common example."
  }
};

const canvas = $("#complexityChart");
const ctx = canvas.getContext("2d");
let selectedComplexity = "n1";

function drawChart(key) {
  selectedComplexity = key;

  const data = complexityData[key];

  $("#chartTitle").textContent = data.title;
  $("#chartExplanation").textContent = data.description;

  $$(".complexity-option").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.complexity === key
    );
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.complexity === key)
    );
  });

  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  const pad = { left: 38, right: 12, top: 15, bottom: 28 };
  const graphWidth = width - pad.left - pad.right;
  const graphHeight = height - pad.top - pad.bottom;

  // Draw background grid.
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(160,170,220,0.12)";

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (graphHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (graphWidth / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, height - pad.bottom);
    ctx.stroke();
  }

  // Label the relative work axis.
  ctx.fillStyle = "#8993b0";
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "right";

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (graphHeight / 4) * i;
    ctx.fillText(String(4 - i), pad.left - 9, y + 3);
  }

  ctx.textAlign = "center";

  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (graphWidth / 5) * i;
    ctx.fillText(String(i * 20), x, height - 8);
  }

  // Draw the conceptual growth curve.
  const values = data.values;
  const max = Math.max(...values);

  const points = values.map((value, index) => ({
    x: pad.left + (index / (values.length - 1)) * graphWidth,
    y: pad.top + graphHeight - (value / max) * graphHeight
  }));

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.strokeStyle = data.color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Fill beneath the curve.
  const last = points[points.length - 1];

  ctx.lineTo(last.x, pad.top + graphHeight);
  ctx.lineTo(points[0].x, pad.top + graphHeight);
  ctx.closePath();

  ctx.fillStyle = `${data.color}18`;
  ctx.fill();

  // Draw points over the curve.
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = data.color;
    ctx.fill();
  });
}

$$("[data-complexity]").forEach((button) => {
  button.addEventListener("click", () => {
    drawChart(button.dataset.complexity);
  });
});

let chartResizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    drawChart(selectedComplexity);
  }, 100);
});

// ---------------- SCROLL REVEAL ANIMATIONS ----------------

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  $$(".reveal").forEach((element) => observer.observe(element));
} else {
  $$(".reveal").forEach((element) => element.classList.add("visible"));
}

// ---------------- INITIALIZE WEBSITE ----------------

generateArray();
drawChart("n1");
