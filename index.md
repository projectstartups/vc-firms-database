---
layout: default
title: VC Firms
---

<h1>Welcome to the VC Firms Directory</h1>

<p>Explore our curated list of VC firms. Click on a firm's name to view its details.</p

<h2>All VC Firms</h2>
<ul>
  {% for post in site.posts %}
    <li><a href="{{ post.url }}">{{ post.title }}</a> - {{ post.offices }}</li>
  {% endfor %}
</ul>

<hr>
<p>Looking for a specific firm? Use our search bar:</p>
<input type="text" id="search" placeholder="Search VC Firms...">
<ul id="results"></ul>

<script src="https://cdn.jsdelivr.net/npm/fuse.js"></script>
<script>
<input type="text" id="search" placeholder="Search VC Firms...">
<ul id="results"></ul>
<script>
  fetch('/search.json')
    .then(response => response.json())
    .then(data => {  
  // Fetch and use JSON for search
  fetch('/search.json')
    .then(response => response.json())
    .then(data => {
      const fuse = new Fuse(data, { keys: ['title', 'offices', 'stages', 'markets'] });
      document.getElementById('search').addEventListener('input', (e) => {
        const results = fuse.search(e.target.value);
        const ul = document.getElementById('results');
        ul.innerHTML = results.map(result => `<li><a href="${result.item.url}">${result.item.title}</a></li>`).join('');
      });
    });
</script>

