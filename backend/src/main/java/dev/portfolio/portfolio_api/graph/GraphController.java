package dev.portfolio.portfolio_api.graph;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GraphController {

    private final GraphQueryService graph;

    public GraphController(GraphQueryService graph) {
        this.graph = graph;
    }

    @GetMapping("/api/graph")
    public GraphResponse graph() {
        return graph.publicGraph();
    }
}
