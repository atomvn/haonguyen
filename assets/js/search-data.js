// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/haonguyen/";
    },
  },{id: "nav-projects",
          title: "projects",
          description: "A collection of my projects.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/haonguyen/projects/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "My github profile and collection of repositories.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/haonguyen/repositories/";
          },
        },{id: "nav-bookshelf",
          title: "bookshelf",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/haonguyen/books/";
          },
        },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/haonguyen/blog/";
          },
        },{id: "nav-people",
          title: "people",
          description: "members of the lab or group",
          section: "Navigation",
          handler: () => {
            window.location.href = "/haonguyen/people/";
          },
        },{id: "post-google-gemini-updates-flash-1-5-gemma-2-and-project-astra",
        
          title: 'Google Gemini updates: Flash 1.5, Gemma 2 and Project Astra <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "We’re sharing updates across our Gemini family of models and a glimpse of Project Astra, our vision for the future of AI assistants.",
        section: "Posts",
        handler: () => {
          
            window.open("https://blog.google/technology/ai/google-gemini-update-flash-ai-assistant-io-2024/", "_blank");
          
        },
      },{id: "post-displaying-external-posts-on-your-al-folio-blog",
        
          title: 'Displaying External Posts on Your al-folio Blog <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.open("https://medium.com/@al-folio/displaying-external-posts-on-your-al-folio-blog-b60a1d241a0a?source=rss-17feae71c3c4------2", "_blank");
          
        },
      },{id: "post-a-post-with-images",
        
          title: "a post with images",
        
        description: "this is what included images could look like",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/haonguyen/blog/2015/images/";
          
        },
      },{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/AloneInTheWorld/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/BackMagician/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/BehindSuspectX/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/HowTheSteelWasTempered/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/HowToReadABook/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/HowToReadAndRemember/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/SherlockHolmesI/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/SherlockHolmesIII/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/TheFamily/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/TheLastDon/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/TheOmerta/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/TheSicilian/";
            },},{id: "books-rừng-na-uy-norwegian-wood",
          title: 'Rừng Na Uy - Norwegian Wood',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/norwegian_wood/";
            },},{id: "books-bố-già-the-godfather",
          title: 'Bố già - The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/haonguyen/books/the_godfather/";
            },},{id: "news-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "News",handler: () => {
              window.location.href = "/haonguyen/news/9_project/";
            },},{id: "projects-uav-swarm-system-for-sar-missions",
          title: 'UAV swarm system for SAR missions',
          description: "UAV swarm system project is developed to solve problems in SAR missions after disasters such as: typhoon, hurricane, landslide...",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/1_project/";
            },},{id: "projects-project-2",
          title: 'project 2',
          description: "a project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/2_project/";
            },},{id: "projects-project-3-with-very-long-name",
          title: 'project 3 with very long name',
          description: "a project that redirects to another website",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/3_project/";
            },},{id: "projects-fixed-wing-flight-controller",
          title: 'Fixed wing flight controller',
          description: "A simple flight controller utilizing STM32F103C8T6 microncontroller with some peripherals to control flight tasks such as: auto take off, normal, balancing flight mode...",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/6_project/";
            },},{id: "projects-project-7",
          title: 'project 7',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/7_project/";
            },},{id: "projects-project-8",
          title: 'project 8',
          description: "an other project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/8_project/";
            },},{id: "projects-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/haonguyen/projects/9_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%68%6E%76%61%6E%68%61%6F@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-facebook',
        title: 'Facebook',
        section: 'Socials',
        handler: () => {
          window.open("https://facebook.com/Văn Hào", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/atomvn", "_blank");
        },
      },{
        id: 'social-instagram',
        title: 'Instagram',
        section: 'Socials',
        handler: () => {
          window.open("https://instagram.com/Van Hao", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/HAO NGUYEN", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
