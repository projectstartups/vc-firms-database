---
layout: default
title: Pre-Seed VC Firms
permalink: /pre-seed/
---

<h1>Pre-Seed VC Firms</h1>
<p>Discover VC firms that invest in pre-seed stage startups.</p>
<ul>
  {% for post in site.posts %}
    {% if post.stages contains "Pre-Seed" %}
      <li><a href="{{ post.url }}">{{ post.title }}</a> - {{ post.offices }}</li>
    {% endif %}
  {% endfor %}
</ul>

