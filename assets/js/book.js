(function () {
  var inChapter = /\/chapters\//.test(location.pathname.replace(/\\/g, "/"));
  var p = inChapter ? "" : "chapters/";
  var home = inChapter ? "../index.html" : "index.html";
  var chapters = [
    ["00-front-matter.html", "00 Front matter"],
    ["01-architectural-overview.html", "01 Overview"],
    ["02-system-architecture.html", "02 System architecture"],
    ["03-installation.html", "03 Installation"],
    ["04-user-tools.html", "04 User tools"],
    ["05-database-clusters.html", "05 Clusters"],
    ["06-configuration.html", "06 Configuration"],
    ["07-data-dictionary.html", "07 Data dictionary"],
    ["08-managing-databases.html", "08 Databases"],
    ["09-security.html", "09 Security"],
    ["10-monitoring.html", "10 Monitoring"],
    ["11-sql-primer.html", "11 SQL primer"],
    ["12-backup-recovery.html", "12 Backup / PITR"],
    ["13-maintenance.html", "13 Maintenance"],
    ["14-moving-data.html", "14 Moving data"],
    ["15-replication.html", "15 Replication / HA"],
    ["16-cheat-sheets.html", "16 Cheat sheets"],
    ["17-mock-exam.html", "17 Mock exam"]
  ];

  var html = '<a class="brand" href="' + home + '">PostgreSQL 18 Study Book</a>' +
    '<div class="brand-sub">EDB Essentials · colorful diagrams</div>' +
    "<h2>Book</h2><ol>" +
    '<li><a href="' + home + '">Home</a></li>';

  chapters.forEach(function (item) {
    html += '<li><a href="' + p + item[0] + '">' + item[1] + "</a></li>";
  });
  html += "</ol>";

  document.querySelectorAll("[data-nav]").forEach(function (rail) {
    rail.innerHTML = html;
  });

  var here = location.pathname.replace(/\\/g, "/");
  document.querySelectorAll(".rail a[href]").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    var name = href.split("/").pop();
    if (name && here.endsWith(name)) a.classList.add("active");
    if (name === "index.html" && /index\.html$/.test(here)) a.classList.add("active");
  });
})();
