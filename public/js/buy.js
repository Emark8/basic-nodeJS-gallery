const buy = document.querySelector("a.buying");

function sold() {
  alert("SOLD!");
}

function cancel() {
  alert("MAYBE NEXT TIME");
}

buy.addEventListener("click", (e) => {
  const endpoint = `/gallery/${buy.dataset.doc}`;

  fetch(endpoint, {
    method: "PUT",
  })
    .then((response) => response.json())
    //.then((data) => console.log(data)) //(window.location.href = data.redirect))
    .catch((err) => console.log(err));
});
