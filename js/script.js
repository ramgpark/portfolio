
    const siteHeader = document.getElementById('header');
    const modal = document.getElementById('portfolioModal');
    const modalDialog = modal.querySelector('.modal-dialog');
    const modalHeroMedia = document.getElementById('modalHeroMedia');
    const modalThumbs = document.getElementById('modalThumbs');
    const modalDynamicBody = document.getElementById('modalDynamicBody');
    const modalClose = modal.querySelector('.modal-close');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    const modalPageIndicator = document.getElementById('modalPageIndicator');

    const modalTemplates = {
      poster: document.getElementById('modalTemplatePoster'),
      banner: document.getElementById('modalTemplateBanner'),
      cardnews: document.getElementById('modalTemplateCardnews'),
      reels: document.getElementById('modalTemplateReels'),
      default: document.getElementById('modalTemplateDefault')
    };

    let lastFocusedElement = null;
    let currentModalImages = [];
    let currentModalTitle = 'Project Title';
    let currentModalIndex = 0;
    let modalTouchStartX = 0;
    let modalTouchDeltaX = 0;

    function getCardPrimaryMedia(source) {
      const imageEl = source.querySelector('img');
      if (imageEl?.getAttribute('src')) {
        return imageEl.getAttribute('src');
      }

      const sourceEl = source.querySelector('video source');
      if (sourceEl?.getAttribute('src')) {
        return sourceEl.getAttribute('src');
      }

      const videoEl = source.querySelector('video');
      if (videoEl?.getAttribute('src')) {
        return videoEl.getAttribute('src');
      }

      return '';
    }

    function isVideoFile(src) {
      return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src || '');
    }

    function createMediaMarkup(src, alt) {
      if (!src) return alt || 'Preview';

      if (isVideoFile(src)) {
        return `
          <video autoplay muted loop playsinline preload="metadata" aria-label="${alt}">
            <source src="${src}">
          </video>
        `;
      }

      return `<img src="${src}" alt="${alt}">`;
    }

    // poster / banner는 data-modal-media 속성으로 썸네일과 다른 모달 전용 이미지를 지정할 수 있습니다.
    function getCardData(source) {
      return {
        type: source.dataset.modalType || 'default',
        title: source.dataset.modalTitle || 'Project Title',
        description: source.dataset.modalDescription || 'Project description',
        role: source.dataset.modalRole || 'Role information',
        tools: source.dataset.modalTools || 'Tool information',
        summary: source.dataset.modalSummary || source.dataset.modalDescription || 'Summary text',
        meta1Label: source.dataset.modalMeta1Label || 'Info 01',
        meta1Value: source.dataset.modalMeta1Value || '-',
        meta2Label: source.dataset.modalMeta2Label || 'Info 02',
        meta2Value: source.dataset.modalMeta2Value || '-',
        meta3Label: source.dataset.modalMeta3Label || 'Info 03',
        meta3Value: source.dataset.modalMeta3Value || '-',
        meta4Label: source.dataset.modalMeta4Label || 'Info 04',
        meta4Value: source.dataset.modalMeta4Value || '-',
        noteTitle: source.dataset.modalNoteTitle || 'Editable Note',
        note: source.dataset.modalNote || 'Write any note here.',
        tags: (source.dataset.modalTags || '').split(',').map(tag => tag.trim()).filter(Boolean),
        link: source.dataset.modalLink || '#',
        subLink: source.dataset.modalSublink || '#',
        images: (source.dataset.modalImages || '').split('|').map(item => item.trim()).filter(Boolean),
        ratio: source.dataset.modalRatio || '',
        modalMedia: source.dataset.modalMedia || '',
        badgeLabel: source.dataset.modalLabel || ({
          poster: 'Poster Project',
          banner: 'Banner Project',
          cardnews: 'Card News Project',
          reels: 'Reels · Video Project',
          default: 'Project Detail'
        }[source.dataset.modalType || 'default'] || 'Project Detail'),
        primaryMedia: getCardPrimaryMedia(source)
      };
    }

    function fillTemplateFields(container, data) {
      container.querySelectorAll('[data-field]').forEach((node) => {
        const key = node.dataset.field;
        node.textContent = data[key] || '';
      });

      container.querySelectorAll('[data-list="tags"]').forEach((list) => {
        list.innerHTML = '';
        if (!data.tags.length) {
          const emptyTag = document.createElement('span');
          emptyTag.className = 'modal-tag';
          emptyTag.textContent = 'No tags';
          list.appendChild(emptyTag);
          return;
        }

        data.tags.forEach((tag) => {
          const chip = document.createElement('span');
          chip.className = 'modal-tag';
          chip.textContent = tag;
          list.appendChild(chip);
        });
      });

      const mainLink = container.querySelector('#modalLink');
      if (mainLink) {
        mainLink.href = data.link;
        mainLink.classList.toggle('is-hidden', data.link === '#');
      }

      const subLink = container.querySelector('#modalSubLink');
      if (subLink) {
        subLink.href = data.subLink;
        subLink.classList.toggle('is-hidden', data.subLink === '#');
      }
    }

    function setModalGalleryMode(type, totalImages) {
      const isMultiPageCardNews = type === 'cardnews' && totalImages > 1;

      modalThumbs.classList.toggle('is-hidden', !isMultiPageCardNews);
      modalPrev.classList.toggle('is-hidden', !isMultiPageCardNews);
      modalNext.classList.toggle('is-hidden', !isMultiPageCardNews);
      modalPageIndicator.classList.toggle('is-hidden', !isMultiPageCardNews);
    }




    function setModalTypeClass(type) {
      modalDialog.classList.remove('modal-type-poster', 'modal-type-banner', 'modal-type-cardnews', 'modal-type-reels', 'modal-type-default');
      const normalized = ['poster', 'banner', 'cardnews', 'reels'].includes(type) ? type : 'default';
      modalDialog.classList.add(`modal-type-${normalized}`);
    }

    function setModalMediaRatio(ratio, type) {
      const fallbackRatios = {
        poster: '3 / 4',
        banner: '16 / 9',
        cardnews: '1 / 1',
        reels: '9 / 16',
        default: '5 / 3'
      };

      const normalizedType = ['poster', 'banner', 'cardnews', 'reels'].includes(type) ? type : 'default';
      const finalRatio = ratio && ratio.trim() ? ratio.trim() : fallbackRatios[normalizedType];

      modalDialog.style.setProperty('--modal-media-ratio', finalRatio);
      modalHeroMedia.style.aspectRatio = finalRatio;
    }

    function renderModalBody(data) {
      const template = modalTemplates[data.type] || modalTemplates.default;
      const fragment = template.content.cloneNode(true);
      const wrapper = document.createElement('div');
      wrapper.className = 'modal-dynamic-body';
      wrapper.appendChild(fragment);
      fillTemplateFields(wrapper, data);
      modalDynamicBody.replaceChildren(wrapper);
    }

    function updateModalThumbActiveState() {
      modalThumbs.querySelectorAll('.modal-thumb').forEach((thumb, index) => {
        thumb.classList.toggle('is-active', index === currentModalIndex);
      });
    }

    function updateModalControls() {
      const total = currentModalImages.length;

      if (!total) {
        modalPrev.disabled = true;
        modalNext.disabled = true;
        modalPageIndicator.textContent = '0 / 0';
        return;
      }

      modalPrev.disabled = currentModalIndex <= 0;
      modalNext.disabled = currentModalIndex >= total - 1;
      modalPageIndicator.textContent = `${currentModalIndex + 1} / ${total}`;
    }

    function renderModalHeroByIndex(index) {
      if (!currentModalImages.length) {
        modalHeroMedia.classList.remove('is-swipe-ready');
        modalHeroMedia.textContent = currentModalTitle;
        updateModalControls();
        return;
      }

      currentModalIndex = Math.max(0, Math.min(index, currentModalImages.length - 1));
      modalHeroMedia.classList.add('is-swipe-ready');
      modalHeroMedia.innerHTML = createMediaMarkup(
        currentModalImages[currentModalIndex],
        `${currentModalTitle} ${currentModalIndex + 1}`
      );
      updateModalThumbActiveState();
      updateModalControls();
    }

    function goToModalSlide(index) {
      renderModalHeroByIndex(index);
    }

    function stepModalSlide(direction) {
      const nextIndex = currentModalIndex + direction;
      if (nextIndex < 0 || nextIndex >= currentModalImages.length) return;
      goToModalSlide(nextIndex);
    }

    function renderModalThumbs(images, title) {
      modalThumbs.innerHTML = '';

      if (!images.length) {
        modalThumbs.innerHTML = '';
        updateModalControls();
        return;
      }

      images.forEach((imageSrc, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'modal-thumb';
        button.innerHTML = createMediaMarkup(imageSrc, `${title} ${index + 1}`);
        button.addEventListener('click', () => {
          goToModalSlide(index);
        });
        modalThumbs.appendChild(button);
      });

      updateModalThumbActiveState();
      updateModalControls();
    }

    function openModal(source) {
      const parentTrack = source.closest('.slider-track');
      if (parentTrack && parentTrack._dragState?.suppressClick) return;

      const data = getCardData(source);

      currentModalTitle = data.title;
      currentModalImages = [...data.images];

      if (data.type === 'poster' || data.type === 'banner' || data.type === 'reels') {
        if (data.modalMedia) {
          currentModalImages = [data.modalMedia];
        } else if (!currentModalImages.length && data.primaryMedia) {
          currentModalImages = [data.primaryMedia];
        }
      }

      currentModalIndex = 0;
      lastFocusedElement = source;

      setModalTypeClass(data.type);
      setModalMediaRatio(data.ratio, data.type);
      renderModalBody(data);
      renderModalThumbs(currentModalImages, data.title);
      setModalGalleryMode(data.type, currentModalImages.length);
      renderModalHeroByIndex(0);

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      modalClose.focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      modalDialog.classList.remove('modal-type-poster', 'modal-type-banner', 'modal-type-cardnews', 'modal-type-reels', 'modal-type-default');
      modalDialog.style.removeProperty('--modal-media-ratio');
      modalHeroMedia.style.removeProperty('aspect-ratio');
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    const setHeaderState = () => {
      if (window.scrollY > 20) siteHeader.classList.add('scrolled');
      else siteHeader.classList.remove('scrolled');
    };

    setHeaderState();
    window.addEventListener('scroll', setHeaderState);

    

    function getStepSize(track) {
      const firstItem = track.firstElementChild;
      if (!firstItem) return Math.max(track.clientWidth * 0.85, 320);

      const trackStyle = window.getComputedStyle(track);
      const itemWidth = firstItem.getBoundingClientRect().width;
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;

      return itemWidth + gap;
    }

    function scrollSlider(track, direction = 1) {
      const step = getStepSize(track);
      track.scrollBy({
        left: step * direction,
        behavior: 'smooth'
      });
    }

    document.querySelectorAll('[data-slider-prev], [data-slider-next]').forEach((button) => {
      button.addEventListener('click', () => {
        const trackId = button.dataset.sliderPrev || button.dataset.sliderNext;
        const track = document.getElementById(trackId);
        if (!track) return;

        const direction = button.hasAttribute('data-slider-next') ? 1 : -1;
        scrollSlider(track, direction);
      });
    });

    function enableDragScroll(track) {
      let isDown = false;
      let startX = 0;
      let startScrollLeft = 0;
      let hasDragged = false;
      let suppressClick = false;

      const threshold = 8;

      track.querySelectorAll('.thumb-card').forEach((card) => {
        card.setAttribute('draggable', 'false');
      });

      const onMouseDown = (e) => {
        if (e.button !== 0) return;
        isDown = true;
        hasDragged = false;
        suppressClick = false;
        startX = e.clientX;
        startScrollLeft = track.scrollLeft;
        track.classList.add('dragging');
      };

      const onMouseMove = (e) => {
        if (!isDown) return;

        const dx = e.clientX - startX;

        if (Math.abs(dx) > threshold) {
          hasDragged = true;
          suppressClick = true;
        }

        if (hasDragged) {
          track.scrollLeft = startScrollLeft - dx;
        }
      };

      const onMouseUp = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('dragging');

        if (hasDragged) {
          setTimeout(() => {
            suppressClick = false;
          }, 0);
        }
      };

      const onMouseLeave = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('dragging');
      };

      track.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      track.addEventListener('mouseleave', onMouseLeave);

      track.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });

      track.addEventListener('click', (e) => {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
      }, true);

      track._dragState = {
        get suppressClick() {
          return suppressClick;
        }
      };
    }

    document.querySelectorAll('.slider-track').forEach(enableDragScroll);

    document.querySelectorAll('.modal-card').forEach((card) => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');

      card.addEventListener('click', () => openModal(card));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openModal(card);
        }
      });
    });

    modalPrev.addEventListener('click', () => stepModalSlide(-1));
    modalNext.addEventListener('click', () => stepModalSlide(1));

    modalHeroMedia.addEventListener('touchstart', (event) => {
      if (currentModalImages.length <= 1) return;
      modalTouchStartX = event.touches[0].clientX;
      modalTouchDeltaX = 0;
    }, { passive: true });

    modalHeroMedia.addEventListener('touchmove', (event) => {
      if (currentModalImages.length <= 1) return;
      modalTouchDeltaX = event.touches[0].clientX - modalTouchStartX;
    }, { passive: true });

    modalHeroMedia.addEventListener('touchend', () => {
      if (currentModalImages.length <= 1) return;
      const swipeThreshold = 50;

      if (modalTouchDeltaX <= -swipeThreshold) {
        stepModalSlide(1);
      } else if (modalTouchDeltaX >= swipeThreshold) {
        stepModalSlide(-1);
      }

      modalTouchStartX = 0;
      modalTouchDeltaX = 0;
    }, { passive: true });

    modalClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });

    window.addEventListener('keydown', (event) => {
      if (!modal.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        closeModal();
      } else if (event.key === 'ArrowLeft') {
        stepModalSlide(-1);
      } else if (event.key === 'ArrowRight') {
        stepModalSlide(1);
      }
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;

        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    const reelCards = document.querySelectorAll('#videoTrack .reels-thumb');

    reelCards.forEach((card) => {
      const video = card.querySelector('.thumb-video');
      if (!video) return;

      card.addEventListener('mouseenter', async () => {
        try {
          card.classList.add('is-playing');
          video.currentTime = 0;
          await video.play();
        } catch (error) {
          console.log('video play error:', error);
        }
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
        card.classList.remove('is-playing');
      });
    });

    const allCards = document.querySelectorAll('.thumb-card');

    allCards.forEach((card) => {
      const video = card.querySelector('.thumb-video');
      if (!video) return;

      card.addEventListener('mouseenter', async () => {
        try {
          video.currentTime = 0;
          await video.play();
        } catch (e) { }
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    });
