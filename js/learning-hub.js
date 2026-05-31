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

  const normalizeText = value => (value || '').replace(/\s+/g, ' ').trim()

  const parseDateFromUrl = url => {
    const match = (url || '').match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)
    if (!match) return 0
    return Number(`${match[1]}${match[2]}${match[3]}`)
  }

  const parseRagentOrder = title => {
    const match = title.match(/^Ragent学习笔记(\d+)/)
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
  }

  const parseHot100Order = title => {
    const match = title.match(/^Hot100：[^\d]*?(\d+)/)
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
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
        text,
        dateValue: parseDateFromUrl(url)
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
          <div class="learning-hub-card-title-row">
            <h3>${section.title}</h3>
            <span class="learning-hub-count">${section.items.length} 篇</span>
          </div>
          <a href="${section.moreHref}">${section.moreText}</a>
        </div>
        <p class="learning-hub-card-desc">${section.description}</p>
        <div class="learning-hub-items">
          ${items || '<div class="learning-hub-empty">暂时还没有内容</div>'}
        </div>
      </section>
    `
  }

  const extractProgressLines = text => {
    const normalized = normalizeText(text)
    const current = normalized.match(/当前阶段：[^。]*。?/)
    const next = normalized.match(/下一步：[^。]*。?/)
    return [current?.[0], next?.[0]].filter(Boolean)
  }

  const pickCurrentFocus = posts => {
    const plan = posts.find(post => post.title.includes('学习计划'))
    const ragentSeries = posts
      .filter(post => post.title.startsWith('Ragent学习笔记'))
      .sort((a, b) => parseRagentOrder(a.title) - parseRagentOrder(b.title))

    const latestRagent = ragentSeries[ragentSeries.length - 1]
    const progressLines = plan ? extractProgressLines(plan.text) : []

    return {
      title: '最近在学',
      lead: latestRagent ? latestRagent.title : 'Agent 开发学习主线',
      lines: progressLines.length ? progressLines : ['当前主线还是 Ragent 项目学习，先把基础扫盲、文档预处理和后续知识库链路持续串起来。'],
      primaryHref: latestRagent?.url || '/blog/categories/ragent/',
      primaryText: latestRagent ? '继续当前主线' : '进入 Ragent 专题',
      secondaryHref: plan?.url || '/blog/2025/10/13/Agent%E5%BC%80%E5%8F%91%E5%AD%A6%E4%B9%A0%E8%AE%A1%E5%88%92-%E8%BF%9B%E5%BA%A6/',
      secondaryText: '查看学习计划'
    }
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

    const focus = pickCurrentFocus(posts)

    const hub = document.createElement('section')
    hub.id = 'learning-hub'
    hub.className = 'learning-hub'
    hub.innerHTML = `
      <div class="learning-focus">
        <div class="learning-focus-main">
          <span class="learning-hub-eyebrow">${focus.title}</span>
          <h2>${escapeHtml(focus.lead)}</h2>
          <div class="learning-focus-list">
            ${focus.lines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        </div>
        <div class="learning-focus-actions">
          <a class="learning-hub-main-link" href="${focus.primaryHref}">${focus.primaryText}</a>
          <a class="learning-hub-secondary-link" href="${focus.secondaryHref}">${focus.secondaryText}</a>
        </div>
      </div>
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
      .sort((a, b) => parseRagentOrder(a.title) - parseRagentOrder(b.title))

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

  const renderHot100SeriesNav = posts => {
    const articleTitle = document.querySelector('.post-title')?.textContent?.trim()
    const articleContainer = document.querySelector('#article-container')
    if (!articleTitle || !articleContainer) return
    if (!articleTitle.startsWith('Hot100：')) return
    if (document.querySelector('#hot100-series-nav')) return

    const series = posts
      .filter(post => post.title.startsWith('Hot100：'))
      .sort((a, b) => {
        if (a.dateValue !== b.dateValue) return a.dateValue - b.dateValue
        const byNumber = parseHot100Order(a.title) - parseHot100Order(b.title)
        if (byNumber !== 0) return byNumber
        return a.title.localeCompare(b.title, 'zh-Hans-CN')
      })

    const currentIndex = series.findIndex(post => post.title === articleTitle)
    if (currentIndex === -1) return

    const prev = currentIndex > 0 ? series[currentIndex - 1] : null
    const next = currentIndex < series.length - 1 ? series[currentIndex + 1] : null

    const seriesNav = document.createElement('section')
    seriesNav.id = 'hot100-series-nav'
    seriesNav.className = 'series-nav-block hot100-series-nav'
    seriesNav.innerHTML = `
      <div class="ragent-series-nav-head">
        <div>
          <span class="ragent-series-nav-eyebrow">题目导航</span>
          <h3>Hot100 复习路线</h3>
        </div>
        <a href="/blog/tags/Hot100/">查看全部题目</a>
      </div>
      <div class="ragent-series-nav-grid">
        <div class="ragent-series-nav-card ${prev ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">上一题</span>
          ${prev ? `<a href="${prev.url}">${escapeHtml(prev.title)}</a>` : '<span>已经是当前专题起点</span>'}
        </div>
        <div class="ragent-series-nav-card ragent-series-current">
          <span class="ragent-series-nav-label">当前</span>
          <strong>${escapeHtml(articleTitle)}</strong>
        </div>
        <div class="ragent-series-nav-card ${next ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">下一题</span>
          ${next ? `<a href="${next.url}">${escapeHtml(next.title)}</a>` : '<span>后续继续补题</span>'}
        </div>
      </div>
    `

    articleContainer.insertAdjacentElement('afterend', seriesNav)
  }

  const classifyPost = title => {
    if (title.startsWith('Ragent学习笔记')) {
      return { text: 'Ragent', className: 'is-ragent' }
    }
    if (title.startsWith('Hot100：')) {
      return { text: 'Hot100', className: 'is-hot100' }
    }
    if (title.startsWith('论文笔记：')) {
      return { text: '论文', className: 'is-paper' }
    }
    if (title.includes('学习计划')) {
      return { text: '计划', className: 'is-plan' }
    }
    return null
  }

  const enhanceRecentPosts = posts => {
    const items = document.querySelectorAll('#recent-posts .recent-post-item')
    if (!items.length) return

    const postMap = new Map(posts.map(post => [post.title, post]))

    items.forEach(item => {
      const titleLink = item.querySelector('.article-title')
      const info = item.querySelector('.recent-post-info')
      if (!titleLink || !info) return
      if (info.querySelector('.learning-card-meta')) return

      const title = normalizeText(titleLink.textContent)
      const post = postMap.get(title)
      const badge = classifyPost(title)
      if (!post || !badge) return

      const meta = document.createElement('div')
      meta.className = 'learning-card-meta'
      meta.innerHTML = `
        <span class="learning-card-badge ${badge.className}">${badge.text}</span>
        <span class="learning-card-date">${post.url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)?.slice(1).join('-') || ''}</span>
      `

      info.insertBefore(meta, titleLink)
    })
  }

  const boot = async () => {
    const posts = await loadPosts()
    renderHomeHub(posts)
    enhanceRecentPosts(posts)
    renderRagentSeriesNav(posts)
    renderHot100SeriesNav(posts)
  }

  document.addEventListener('DOMContentLoaded', boot)

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', boot, 'learningHubBoot')
  }
})()
