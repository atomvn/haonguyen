---
layout: page
title: news
description: "My life stories"
permalink: /news/
nav: true
nav_order: 5
---

<!-- {% include news.liquid %} -->
<!-- pages/news.md -->
<div class="news">
{% if site.enable_project_categories and page.display_categories %}
  <!-- Display categorized news -->
  {% for category in page.display_categories %}
  <a id="{{ category }}" href=".#{{ category }}">
    <h2 class="category">{{ category }}</h2>
  </a>
  {% assign categorized_news = site.news | where: "category", category %}
  {% assign sorted_news = categorized_news | sort: "importance" %}
  <!-- Generate cards for each project -->
  {% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_news %}
      {% include news_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_news %}
      {% include news.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  {% endfor %}

{% else %}

<!-- Display news without categories -->

{% assign sorted_news = site.news | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_news %}
      {% include news_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_news %}
      {% include news.liquid %}
    {% endfor %}
  </div>
  {% endif %}
{% endif %}
</div>


