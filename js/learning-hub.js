(function () {
  const SEARCH_XML_PATH = '/blog/search.xml'

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

  const decodeHtml = value => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = value || ''
    return textarea.value
  }

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
    const hot100Series = posts
      .filter(post => post.title.startsWith('Hot100：'))
      .sort((a, b) => parseHot100Order(a.title) - parseHot100Order(b.title))

    const latestRagent = ragentSeries[ragentSeries.length - 1]
    const latestHot100 = hot100Series[hot100Series.length - 1]
    const progressLines = plan ? extractProgressLines(plan.text) : []

    return {
      title: '最近在学',
      lead: latestRagent ? latestRagent.title : 'Agent 开发学习主线',
      lines: progressLines.length ? progressLines : ['当前主线还是 Ragent 项目学习，先把基础扫盲、文档预处理和后续知识库链路持续串起来。'],
      primaryHref: latestRagent?.url || '/blog/ragent/',
      primaryText: latestRagent ? '继续当前主线' : '进入 Ragent 专题',
      secondaryHref: plan?.url || '/blog/2025/10/13/Agent%E5%BC%80%E5%8F%91%E5%AD%A6%E4%B9%A0%E8%AE%A1%E5%88%92-%E8%BF%9B%E5%BA%A6/',
      secondaryText: '查看学习计划',
      stats: [
        { value: ragentSeries.length, label: 'Ragent 笔记', note: '项目主线' },
        { value: hot100Series.length, label: 'Hot100 题', note: '算法复盘' },
        { value: posts.filter(post => post.title.startsWith('论文笔记：')).length, label: '论文笔记', note: '推荐系统' }
      ],
      lanes: [
        { label: 'Ragent 地图', href: '/blog/ragent/', meta: latestRagent ? `更新到 ${latestRagent.title.match(/Ragent学习笔记\d+/)?.[0] || '当前章节'}` : '项目主线' },
        { label: 'Hot100 路线', href: '/blog/hot100/', meta: latestHot100 ? '最近复习移动零' : '算法题库' },
        { label: 'Agent 计划', href: plan?.url || '/blog/2025/10/13/Agent%E5%BC%80%E5%8F%91%E5%AD%A6%E4%B9%A0%E8%AE%A1%E5%88%92-%E8%BF%9B%E5%BA%A6/', meta: '打卡进度' }
      ]
    }
  }

  const renderHomeHub = posts => {
    const recentPosts = document.querySelector('#recent-posts')
    if (!recentPosts) return
    if (document.querySelector('#learning-hub')) return

    const focus = pickCurrentFocus(posts)

    const hub = document.createElement('section')
    hub.id = 'learning-hub'
    hub.className = 'learning-hub'
    hub.innerHTML = `
      <div class="learning-focus">
        <div class="learning-focus-core">
          <div class="learning-focus-main">
            <span class="learning-hub-eyebrow">${focus.title}</span>
            <h2>${escapeHtml(decodeHtml(focus.lead))}</h2>
            <div class="learning-focus-list">
              ${focus.lines.map(line => `<p>${escapeHtml(decodeHtml(line))}</p>`).join('')}
            </div>
          </div>
          <div class="learning-focus-actions">
            <a class="learning-hub-main-link" href="${focus.primaryHref}">${focus.primaryText}</a>
            <a class="learning-hub-secondary-link" href="${focus.secondaryHref}">${focus.secondaryText}</a>
          </div>
        </div>
        <div class="learning-focus-panel" aria-label="学习进度概览">
          <div class="learning-focus-panel-title">学习坐标</div>
          <div class="learning-focus-stats">
            ${focus.stats.map(item => `
              <div class="learning-focus-stat">
                <strong>${item.value}</strong>
                <span>${escapeHtml(item.label)}</span>
                <small>${escapeHtml(item.note)}</small>
              </div>
            `).join('')}
          </div>
          <div class="learning-focus-lanes">
            ${focus.lanes.map(item => `
              <a href="${item.href}">
                <span>${escapeHtml(item.label)}</span>
                <small>${escapeHtml(item.meta)}</small>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    `

    recentPosts.prepend(hub)
  }

  const tuneArticleAside = () => {
    const aside = document.querySelector('#aside-content')
    const sticky = aside?.querySelector('.sticky_layout')
    const cardToc = aside?.querySelector('#card-toc')
    if (!aside || !sticky || !cardToc) return

    if (aside.firstElementChild !== sticky) {
      aside.prepend(sticky)
    }

    if (sticky.firstElementChild !== cardToc) {
      sticky.prepend(cardToc)
    }
    aside.classList.add('article-toc-first')
  }

  const renderAsideLearningNav = () => {
    const aside = document.querySelector('#aside-content')
    const sticky = aside?.querySelector('.sticky_layout')
    if (!aside) return
    if (document.querySelector('#aside-learning-nav')) return

    const nav = document.createElement('div')
    nav.id = 'aside-learning-nav'
    nav.className = 'card-widget aside-learning-nav'
    nav.innerHTML = `
      <div class="item-headline">
        <i class="fas fa-compass"></i>
        <span>学习入口</span>
      </div>
      <div class="aside-learning-links">
        <a href="/blog/ragent/">
          <span>Ragent 地图</span>
          <small>项目主线</small>
        </a>
        <a href="/blog/hot100/">
          <span>Hot100 路线</span>
          <small>算法题库</small>
        </a>
        <a href="/blog/2025/10/13/Agent%E5%BC%80%E5%8F%91%E5%AD%A6%E4%B9%A0%E8%AE%A1%E5%88%92-%E8%BF%9B%E5%BA%A6/">
          <span>Agent 学习计划</span>
          <small>打卡进度</small>
        </a>
      </div>
    `

    const cardToc = aside.querySelector('#card-toc')
    if (cardToc) {
      cardToc.insertAdjacentElement('afterend', nav)
      return
    }

    const announcement = aside.querySelector('.card-announcement')
    if (announcement) {
      announcement.insertAdjacentElement('beforebegin', nav)
    } else if (sticky) {
      sticky.prepend(nav)
    } else {
      aside.appendChild(nav)
    }
  }

  const renderCoreTagNav = () => {
    const aside = document.querySelector('#aside-content')
    const sticky = aside?.querySelector('.sticky_layout')
    if (!aside) return
    if (document.querySelector('#aside-core-tags')) return

    const card = document.createElement('div')
    card.id = 'aside-core-tags'
    card.className = 'card-widget aside-core-tags'
    card.innerHTML = `
      <div class="item-headline">
        <i class="fas fa-layer-group"></i>
        <span>核心主题</span>
      </div>
      <div class="aside-core-tag-list">
        <a href="/blog/ragent/">Ragent</a>
        <a href="/blog/hot100/">Hot100</a>
        <a href="/blog/tags/论文笔记/">论文笔记</a>
        <a href="/blog/tags/Git/">开发工具</a>
      </div>
    `

    const categories = aside.querySelector('.card-categories')
    if (categories) {
      categories.insertAdjacentElement('afterend', card)
    } else if (sticky) {
      sticky.appendChild(card)
    } else {
      aside.appendChild(card)
    }
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
        <a href="/blog/ragent/">查看学习地图</a>
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
        <a href="/blog/hot100/">查看题型路线</a>
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

  const pickCardKeywords = title => {
    if (title.startsWith('Ragent学习笔记06')) return ['RAG', 'Chunk', '文档分块']
    if (title.startsWith('Ragent学习笔记05')) return ['RAG', 'Tika', '文档解析']
    if (title.startsWith('Ragent学习笔记04')) return ['RAG', '检索增强', '知识库']
    if (title.startsWith('Ragent学习笔记03')) return ['Prompt', '角色设定', '输出约束']
    if (title.startsWith('Ragent学习笔记02')) return ['API', '模型调用', '参数']
    if (title.startsWith('Ragent学习笔记01')) return ['大模型', '训练阶段', '量化']
    if (title.includes('两数之和')) return ['HashMap', '补数', '一次遍历']
    if (title.includes('字母异位词')) return ['HashMap', '分组', '排序']
    if (title.includes('最长连续序列')) return ['HashSet', '起点判断', 'O(n)']
    if (title.includes('搜索插入位置')) return ['二分查找', 'left', '边界']
    if (title.startsWith('论文笔记：')) return ['论文笔记', '推荐系统', 'LLM']
    if (title.includes('学习计划/进度')) return ['学习计划', 'Ragent', 'Hot100']
    if (title.includes('Git')) return ['Git', 'GitHub', '版本控制']
    return ['学习记录']
  }

  const renderCardKeywords = title => {
    const keywords = pickCardKeywords(title)
    return keywords.map(keyword => `<span>${escapeHtml(keyword)}</span>`).join('')
  }

  const markPostCards = () => {
    document.querySelectorAll('#recent-posts .recent-post-item').forEach((card, index) => {
      const title = card.querySelector('.article-title')?.textContent?.trim() || ''
      card.classList.toggle('series-ragent', title.startsWith('Ragent学习笔记'))
      card.classList.toggle('series-hot100', title.startsWith('Hot100：'))
      card.classList.toggle('series-paper', title.startsWith('论文笔记：'))
      card.classList.toggle('series-plan', title.includes('学习计划/进度'))
      card.classList.toggle('is-featured-study-card', index === 0)
      card.style.setProperty('--study-reveal-index', index)

      if (!card.querySelector('.study-card-keywords')) {
        const info = card.querySelector('.recent-post-info')
        const keywordRow = document.createElement('div')
        keywordRow.className = 'study-card-keywords'
        keywordRow.innerHTML = renderCardKeywords(title)
        info?.appendChild(keywordRow)
      }
    })
  }

  const applyStudyReveal = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const targets = [
      '#learning-hub',
      '#recent-posts .recent-post-item',
      '#aside-content .card-widget',
      '.ragent-series-nav',
      '.series-nav-block'
    ]

    const elements = Array.from(document.querySelectorAll(targets.join(',')))
      .filter(element => !element.dataset.studyRevealReady)

    if (!elements.length) return

    elements.forEach((element, index) => {
      element.dataset.studyRevealReady = 'true'
      if (!element.style.getPropertyValue('--study-reveal-index')) {
        element.style.setProperty('--study-reveal-index', index)
      }
      element.classList.add('study-reveal')
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
        element.classList.add('is-visible')
      }
    })

    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        currentObserver.unobserve(entry.target)
      })
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    })

    elements.forEach(element => observer.observe(element))
  }

  const boot = async () => {
    const posts = await loadPosts()
    tuneArticleAside()
    renderHomeHub(posts)
    renderAsideLearningNav()
    renderCoreTagNav()
    renderRagentSeriesNav(posts)
    renderHot100SeriesNav(posts)
    markPostCards()
    applyStudyReveal()
  }

  document.addEventListener('DOMContentLoaded', boot)

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', boot, 'learningHubBoot')
  }
})()
