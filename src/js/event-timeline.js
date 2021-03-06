class TimelineEvent {
    constructor(title, subtitle, datestring, details=[], tags=[]) {
        this.title = title
        this.subtitle = subtitle
        this.datestring = datestring
        this.details = details
        this.tags = tags
    }
}

class Timeline extends HTMLElement {
    get events() {
        let events = this.looking == true ? [new TimelineEvent('looking for new opportunities', null, 'now')] : [];
        console.log(this.looking)
        return events.concat([
            new TimelineEvent(
                'senior software engineer', 
                'citrine informatics',
                'jan 2018 to apr 2020',
                [
                    'Directed first round of architectural discussions for revamped data model',
                    'Directed movement of team to monorepository and backend language unification',
                    'Personally designed and built distributed batch computing service for long-running, dynamically de ned long-running tasks',
                    'Collaboratively designed, built, and maintained con gurable machine learning service on top of batch computing service',
                    'Planned and executed engineering offsites',
                    'Screened countless engineers, interviewed hundreds, hired dozens'
                ],
                ['scala', 'python', 'architecture', 'startups']
            ),
            new TimelineEvent(
                'managing partner', 
                'covalent ventures',
                'apr 2016 to sept 2019',
                [
                    'Raised $2.2M in limited partner commitments',
                    'Formed partnerships with VC firms in Seattle and Silicon Valley',
                    'Helped portfolio companies with development, growth, and hiring',
                    'Maintained on-paper returns of >5x over 18 months'
                ]
                
            ),
            new TimelineEvent(
                'consultant engineer', 
                'stackery.io',
                'sept 2016 to mar 2017',
                [
                    'Designed/architected entirely new frontend',
                    'Scaffolded frontend application',
                    'Trained team on proper React/Redux implementation',
                    'Worked with team to finish application'
                ]
            ),
            new TimelineEvent(
                'founder and architect', 
                'rebase',
                'oct 2014 to sept 2017',
                [
                    'architected scalable microservice architecture for code analysis',
                    'led team of five developers',
                    'Developed complex ast traversal tools and ml featurizers',
                    'Found purchaser and executed sale'
                ]
            ),
            new TimelineEvent(
                'founding engineer', 
                'spiral genetics',
                'may 2012 to sept 2015',
                [
                    'Developed highly reliable upload tool for files in petabyte range',
                    'Helped architect novel distributed computing platform',
                    'Sourced custom hardware for on-premises computation',
                    'Developed program for, hired, and managed intern team'
                ]
            ),
            new TimelineEvent(
                'engineer', 
                'aurora consulting',
                'sept 2009 to may 2012',
                [
                    'Developed custom software for academic labs',
                    'Worked with PIs to understand project requirements',
                    'Developed applications in complex domains including computer vision, robotics, and reaction modeling'
                ]
            ),
        ])
    }

    get looking() {
        return this.hasAttribute('looking') ? this.getAttribute('looking') == 'true' : true;
    }

    get align() {
        return this.hasAttribute('chart-align') ? this.getAttribute('chart-align') : 'center';
    }

    connectedCallback() {
        this.render();
        window.addEventListener('resize', this.render.bind(this));
        window.addEventListener('orientationchange', this.render.bind(this));
        window.addEventListener('scroll', this._handleScroll.bind(this));
        this._handleScroll();
    }

    _handleScroll() {
        this.render();
        const node = d3.select(this).selectAll('.event').classed('centered', false).nodes().sort((a,b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            const positionA = rectA.top + rectA.height / 2;
            const positionB = rectB.top + rectB.height / 2;
            return Math.abs(window.innerHeight / 2 - positionA) - Math.abs(window.innerHeight / 2 - positionB);
        })[0];
        d3.select(node).classed('centered', true);
    }

    _setConstants() {
        this.orientation = this.clientWidth > this.clientHeight ? 'landscape' : 'portrait';
        this.headerFontSize = parseInt(getComputedStyle(this).fontSize);
        this.paragraphFontSize = this.headerFontSize * 0.666;
        this.headerCharWidth = this.headerFontSize * 0.56;
        this.paragraphCharWidth = this.paragraphFontSize * 0.56;
        this.dotSize = this.headerFontSize;
        this.horizontalSpacing = this.dotSize;
        this.verticalSpacing = this.dotSize;
        this.minEventHeight = this.headerFontSize * 4;
    }


    render() {
        this._setConstants();
        const svg = d3.select(this).selectAll('svg').data([1]).join('svg');
        const drawing = svg.selectAll('.drawing').data([1]).join('g').classed('drawing', true);
        
        const events = drawing.selectAll('.event').data(this.events).join('g').classed('event', true);
        const dates = events.selectAll('.date').data(event => [event.datestring]).join('text').classed('date', true).text(date => date).attr('font-size', this.paragraphFontSize);
        const dateWidth = Math.max(
            ...dates.nodes().map(n => n.getBoundingClientRect()).map(r => this.orientation == 'landscape' ? Math.max(r.width, r.height) : Math.min(r.width, r.height))
        )
        const descriptionWidth = Math.min(
            this.offsetWidth - dateWidth - this.dotSize - 3 * this.horizontalSpacing,
            this.paragraphCharWidth * 80
        );

        const descriptions = events.selectAll('.description').data(event => [event]).join('g').classed('description', true);
        const titles = descriptions.selectAll('.title').data(event => [event.title]).join('text').classed('title', true).text(title => title);
        const subtitles = descriptions.selectAll('.subtitle').data(event => [event.subtitle]).join('text').classed('subtitle', true).text(subtitle => subtitle).attr('font-size', this.paragraphFontSize);
        const details = descriptions.selectAll('.detail').data(event => [event.details]).join('text').classed('detail', true).attr('font-size', this.paragraphFontSize);
        
        // Split details section into lines, because SVG doesn't handle that for us
        details.selectAll('tspan').data(details => {
            let split = (detail) => detail.split(' ').reduce((lines, word) => {
                const lineLength = lines[lines.length - 1].length;
                if ((lineLength + word.length) * this.paragraphCharWidth <= descriptionWidth) {
                    lines[lines.length - 1] += ' ' + word
                } else {
                    lines.push(word)
                }
                return lines;
            }, ['•']);
            return details.reduce((all, detail) => all.concat(split(detail)), []);
        }).join('tspan').text(text => text).attr('y', (_, index) => index * 1.25 * this.paragraphFontSize).attr('x', text => text.startsWith('•') ? 0 : 2 * this.paragraphCharWidth);
        
        const lines = events.selectAll('line').data((event, index, nodes) => index == nodes.length - 1 ? [] : [event]).join('line');
        const dots = events.selectAll('.dot').data(event => [event]).join('circle').classed('dot', true);
        
        const verticalOffset = Math.max(this.headerFontSize / 2, this.dotSize / 2 + this.dotSize / 4);
        const horizontalOffset = dateWidth + this.dotSize + this.dotSize / 4 + 2 * this.horizontalSpacing;
        dates.attrs({ 
            x: dateWidth,
            y: verticalOffset, 
            'dominant-baseline': 'middle', 
            'text-anchor': 'end',
            'transform': this.orientation == 'portrait' ? `rotate(-90 ${dateWidth} ${verticalOffset})` : 'rotate(0)'
        });
        descriptions.attr('transform', `translate(${horizontalOffset}, ${verticalOffset})`);
        titles.attrs({ x: 0, y: 0, 'dominant-baseline': 'middle' });
        subtitles.attrs({ 
            x: this.headerFontSize / 10, // Empirical shift to align text. TODO: Improve 
            y: this.headerFontSize, 
            'dominant-baseline': 'middle'
        });
        details.attr('transform', `translate(${this.headerFontSize / 10}, ${this.headerFontSize * 2.5})`);
        dots.attrs({ 
            cx: dateWidth + this.horizontalSpacing + this.dotSize / 2 + this.dotSize / 4, // date + spacing + radius + stroke 
            cy: verticalOffset, 
            r: this.dotSize / 2, 
            'stroke-width': this.dotSize / 2  
        });
        
        let totalHeight = 0;
        events.attr('transform', (_, index, nodes) => {
            const description = d3.select(nodes[index]).select('.description').node().getBoundingClientRect();
            const date = d3.select(nodes[index]).select('.date').node().getBoundingClientRect();
            const height = Math.max(this.minEventHeight, description.height, date.height) + 2 * this.verticalSpacing;
            d3.select(nodes[index]).select('line').attrs({
                x1: dateWidth + this.horizontalSpacing + this.dotSize / 2 + this.dotSize / 4,
                x2: dateWidth + this.horizontalSpacing + this.dotSize / 2 + this.dotSize / 4,
                y1: verticalOffset,
                y2: height,
                'stroke-width': this.dotSize / 4
            });
            const translate = `translate(0, ${totalHeight})`;
            totalHeight += height;
            return translate
        })
        if (this.align == 'center') {
            drawing.attr('transform', (_, index, nodes) => {
                const totalWidth = nodes[index].parentNode.getBoundingClientRect().width;
                console.log('total width is ' + totalWidth)
                console.log('description width is ' + descriptionWidth)
                return `translate(${(totalWidth - descriptionWidth) / 2}, 0)`;
            });
        }
        svg.attrs({
            height: drawing.nodes()[0].getBoundingClientRect().height,
            width: drawing.nodes()[0].getBoundingClientRect().width
        });
        // TODO: Clean this up
        // Its use is drawing a rectangle around the event for hover actions
        events.selectAll('rect').data([1]).join('rect').attrs((_, index, nodes) => {
            const event = nodes[index].parentNode.getBoundingClientRect();
            const title = d3.select(nodes[index].parentNode).select('.title').node().getBoundingClientRect();
            const width = drawing.node().getBoundingClientRect().width;
            return { width: width, height: event.height - title.height / 2 }
        }).attr('fill', 'black').attr('opacity', '0');

    }


}

customElements.define('event-timeline', Timeline);