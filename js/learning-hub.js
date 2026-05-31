(function () {
  const SEARCH_XML_PATH = '/blog/search.xml'

  const sections = [
    {
      key: 'ragent',
      title: 'Ragent 学习笔记',
      description: '从大模型、Prompt、RAG 到文档解析和分块，按学习顺序继续推进。',
      match: post => post.title.startsWith('Ragent学习笔记'),
      moreText: '进入 Ragent 专题',
      moreHref: '/blog/categories/ragent/'
    },
    {
      key: 'hot100',
      title: 'Hot100 算法复习',
      description: '按题型回看哈希、二分和后续专题，适合短时复习和刷题回顾。',
      match: post => post.title.startsWith('Hot100：'),
      moreText: '进入 Hot100',
      moreHref: '/blog/tags/Hot100/'
    },
    {
      key: 'paper',
      title: '论文笔记',
      description: '推荐系统与大模型相关论文整理，适合做知识扩展和面试素材补充。',
      match: post => post.title.startsWith('论文笔记：'),
      moreText: '进入论文笔记',
      moreHref: '/blog/categories/%E8%AE%BA%E6%96%87%E7%AC%94%E8%AE%B0/'
    },
    {
      key: 'plan',
      title: '学习计划与路线',
      description: '学习节奏、阶段目标和进度记录，方便随时校准当前主线任务。',
      match: post => post.title.includes('学习计划') || post.title.includes('学习路线'),
      moreText: '查看学习计划',
      moreHref: '/blog/2025/10/13/Agent%E5%BC%80%E5%8F%91%E5%AD%A6%E4%B9%A0%E8%AE%A1%E5%88%92-%E8%BF%9B%E5%BA%A6/'
    }
  ]

  const state = {
    posts: null,
    loading: null
  }

  const escapeHtml = value => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  const parseSearchXml = xmlText => {
    const parser = new DOMParser()
    const xml = parser.parseFromString(xmlText, 'text/xml')
    return Array.from(xml.querySelectorAll('entry')).map(entry => {
      const title = entry.querySelector('title')?.textContent?.trim() || ''
      const url = entry.querySelector('url')?.textContent?.trim() || '#'
      const rawContent = entry.querySelector('content')?.textContent || ''
      const text = rawContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      return {
        title,
        url,
        text
      }
    }).filter(post => post.title)
  }

  const loadPosts = async () => {
    if (state.posts) return state.posts
    if (state.loading) return state.loading

    state.loading = fetch(SEARCH_XML_PATH)
      .then(response => response.text())
      .then(text => {
        state.posts = parseSearchXml(text)
        return state.posts
      })
      .catch(() => {
        state.posts = []
        return state.posts
      })

    return state.loading
  }

  const createHubCard = section => {
    const items = section.items.slice(0, 3).map(post => {
      const excerpt = escapeHtml((post.text || '').slice(0, 88)) + ((post.text || '').length > 88 ? '...' : '')
      return `
        <a class="learning-hub-item" href="${post.url}">
          <span class="learning-hub-item-title">${escapeHtml(post.title)}</span>
          <span class="learning-hub-item-excerpt">${excerpt}</span>
        </a>
      `
    }).join('')

    return `
      <section class="learning-hub-card learning-hub-${section.key}">
        <div class="learning-hub-card-head">
          <h3>${section.title}</h3>
          <a href="${section.moreHref}">${section.moreText}</a>
        </div>
        <p class="learning-hub-card-desc">${section.description}</p>
        <div class="learning-hub-items">
          ${items || '<div class="learning-hub-empty">暂时还没有内容</div>'}
        </div>
      </section>
    `
  }

  const renderHomeHub = posts => {
    const recentPosts = document.querySelector('#recent-posts')
    if (!recentPosts) return
    if (document.querySelector('#learning-hub')) return

    const sectionData = sections.map(section => ({
      ...section,
      items: posts.filter(section.match).slice().sort((a, b) => b.url.localeCompare(a.url))
    })).filter(section => section.items.length > 0)

    if (!sectionData.length) return

    const hub = document.createElement('section')
    hub.id = 'learning-hub'
    hub.className = 'learning-hub'
    hub.innerHTML = `
      <div class="learning-hub-banner">
        <div>
          <span class="learning-hub-eyebrow">学习中控台</span>
          <h2>按主题进入，而不只是按时间翻页</h2>
          <p>把正在学的主线、算法复习和论文扩展拆成清晰入口，回看会轻松很多。</p>
        </div>
        <a class="learning-hub-main-link" href="/blog/2025/10/13/Agent%E5%BC%80%E5%8F%91%E5%AD%A6%E4%B9%A0%E8%AE%A1%E5%88%92-%E8%BF%9B%E5%BA%A6/">查看当前学习计划</a>
      </div>
      <div class="learning-hub-grid">
        ${sectionData.map(createHubCard).join('')}
      </div>
    `

    recentPosts.parentNode.insertBefore(hub, recentPosts)
  }

  const renderRagentSeriesNav = posts => {
    const articleTitle = document.querySelector('.post-title')?.textContent?.trim()
    const articleContainer = document.querySelector('#article-container')
    if (!articleTitle || !articleContainer) return
    if (!articleTitle.startsWith('Ragent学习笔记')) return
    if (document.querySelector('#ragent-series-nav')) return

    const series = posts
      .filter(post => post.title.startsWith('Ragent学习笔记'))
      .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))

    const currentIndex = series.findIndex(post => post.title === articleTitle)
    if (currentIndex === -1) return

    const prev = currentIndex > 0 ? series[currentIndex - 1] : null
    const next = currentIndex < series.length - 1 ? series[currentIndex + 1] : null

    const seriesNav = document.createElement('section')
    seriesNav.id = 'ragent-series-nav'
    seriesNav.className = 'ragent-series-nav'
    seriesNav.innerHTML = `
      <div class="ragent-series-nav-head">
        <div>
          <span class="ragent-series-nav-eyebrow">系列导航</span>
          <h3>Ragent 学习路线</h3>
        </div>
        <a href="/blog/categories/ragent/">查看全部笔记</a>
      </div>
      <div class="ragent-series-nav-grid">
        <div class="ragent-series-nav-card ${prev ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">上一节</span>
          ${prev ? `<a href="${prev.url}">${escapeHtml(prev.title)}</a>` : '<span>已经是第一篇</span>'}
        </div>
        <div class="ragent-series-nav-card ragent-series-current">
          <span class="ragent-series-nav-label">当前</span>
          <strong>${escapeHtml(articleTitle)}</strong>
        </div>
        <div class="ragent-series-nav-card ${next ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">下一节</span>
          ${next ? `<a href="${next.url}">${escapeHtml(next.title)}</a>` : '<span>后续继续更新</span>'}
        </div>
      </div>
    `

    articleContainer.insertAdjacentElement('afterend', seriesNav)
  }

  const boot = async () => {
    const posts = await loadPosts()
    renderHomeHub(posts)
    renderRagentSeriesNav(posts)
  }

  document.addEventListener('DOMContentLoaded', boot)

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', boot, 'learningHubBoot')
  }
})()
