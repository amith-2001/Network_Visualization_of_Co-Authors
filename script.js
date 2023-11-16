// Load graph data from the JSON file
d3.json('graph.json').then(graph => {
    // Calculate degree of the nodes
    const node_degree = {};
    graph.links.forEach(d => {
        node_degree[d.source] = (node_degree[d.source] || 0) + 1;
        node_degree[d.target] = (node_degree[d.target] || 0) + 1;
    });

    // Save the original degree for later use
    const original_degree = { ...node_degree };

    const countries = [...new Set(graph.nodes.flatMap(node => node.publications.map(pub => pub[Object.keys(pub)[0]].Country)))];

    // Define a color scale for countries
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(countries)
        .range(d3.schemeCategory10);

    // Create a scale for node radius
    const scale_radius = d3.scaleLinear()
        .domain(d3.extent(Object.values(node_degree)))
        .range([5, 20]); // Adjust the range to change the node size

    // Select the SVG container
    const svg = d3.select("svg");

    // Create zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10]) // Adjust the zoom scale range as needed
        .on("zoom", zoomed);

    // Apply zoom behavior to the SVG container
    svg.call(zoom);


    let linkStrengthValue = 1;
    let collideForceValue = 0;
    let chargeForceValue = -1;
    
    // Create force simulation
    const simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(d => d.id).strength(() => linkStrengthValue))
        .force("charge", d3.forceManyBody().strength(chargeForceValue))
        .force("center", d3.forceCenter(750, 650));
    
    // Function to apply form settings
    function applySettings() {
        linkStrengthValue = +document.getElementById("linkStrength").value;
        collideForceValue = +document.getElementById("collideForce").value;
        chargeForceValue = +document.getElementById("chargeForce").value;
    
        simulation.force("link").strength(() => linkStrengthValue);
        simulation.force("charge").strength(chargeForceValue);
    
        simulation.alpha(1).restart(); // Restart simulation to apply new settings
    }
    
    document.getElementById("applyChanges").addEventListener("click", function (event) {
        applySettings();
    });
    // Draw links
    const link = svg.selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke", "#999")
        .attr("stroke-width", "1");

    // Draw nodes
    const node = svg.selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("fill", d => colorScale(d.publications[0][Object.keys(d.publications[0])[0]].Country)) // Set color based on country
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", showTooltip);

        function showTooltip(d) {
            const tooltip = d3.select("#tooltip");
        
            // Extract the necessary fields from the data
            const title = d.publications[0][Object.keys(d.publications[0])[0]].Title;
            const year = d.publications[0][Object.keys(d.publications[0])[0]].Year;
            const citations = d.publications[0][Object.keys(d.publications[0])[0]].Citations;
            const publisher = d.publications[0][Object.keys(d.publications[0])[0]].Publisher;
            const country = d.publications[0][Object.keys(d.publications[0])[0]].Country;
            const id = d.id;
        
            // Construct the tooltip content
            const content = `
                <strong>Title:</strong> ${title}<br>
                <strong>Year:</strong> ${year}<br>
                <strong>Citations:</strong> ${citations}<br>
                <strong>Publisher:</strong> ${publisher}<br>
                <strong>Country:</strong> ${country}<br>
                <strong>Id:</strong> ${id}<br>
            `;
        
            // Set tooltip content and position
            tooltip
            .html(content)
            .style("right", (window.innerWidth - d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px")
            .classed("show", true);
        }
        



    function zoomed() {
        svg.attr("transform", d3.event.transform);
    }

    // Add legend
    const legend = svg.selectAll(".legend")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => "translate(0," + i * 20 + ")");

    legend.append("rect")
        .attr("x", 20)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorScale);

    legend.append("text")
        .attr("x", 45)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);

    // Update position of nodes and links on each tick of the simulation
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // Use scale_radius here
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => scale_radius(original_degree[d.id]));
    });

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
});
