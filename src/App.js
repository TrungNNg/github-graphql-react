import React from "react";
import axios from "axios";

//Create a Axios instance with default uri
//and send a token for authorization in header
const axiosGithubGraphQL = axios.create({
  baseURL: "https://api.github.com/graphql",
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`,
  },
});

//this is the query to send as data in post request.
const GET_ISSUES_OF_REPOSITORY = `
query(
  $organization: String!, 
  $repository: String!,
  $cursor: String
) {
  organization(login: $organization){
    name
    url
    repository(name:$repository){
      name
      url
      issues(first: 5, after: $cursor, states: [OPEN]){
        edges {
          node {
            id
            title
            url
            reactions(last: 3){
              edges {
                node {
                  id
                  content
                }
              }
            }
          }
        }
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
}
`;

//this function take in the path in state, split path to get organization and repo
//send the query with necessary varibles via post request using axios instance
//this will return data as a promise if success.
const getIssuesOfRepository = (path, cursor) => {
  const [organization, repository] = path.split("/");

  return axiosGithubGraphQL.post("", {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository, cursor },
  });
};

//RECIEVE: data from promise (queryResult) and cursor (undefined in initial fetch)
//RETURN: function that recieve previous state and return state object.
const resolveIssuesQuery = (queryResult, cursor) => (state) => {
  const { data, errors } = queryResult.data;

  //if no cursor means initial fetch so return state object.
  if (!cursor) {
    return {
      organization: data.organization,
      errors,
    };
  }

  //get edges from previous state and new state and rename them
  const { edges: oldIssue } = state.organization.repository.issues;
  const { edges: newIssue } = data.organization.repository.issues;
  //merge into 1
  const updatedIssues = [...oldIssue, ...newIssue];

  //return state object by update each level with new query result using spead, 
  //only edges need to be updated with updatedIssue
  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues,
        },
      },
    },
    errors,
  };
};

class App extends React.Component {
  state = {
    path: "facebook/create-react-app",
    organization: null,
    error: null,
  };

  //initial fetch
  componentDidMount() {
    this.onFetchFromGithub(this.state.path);
  }

  //RECIEVE: path, cursor is undefind in initial fetch.
  //getIssuesOfRepository return a promise with data
  onFetchFromGithub = (path, cursor) => {
    getIssuesOfRepository(path, cursor).then((queryResult) =>
      this.setState(resolveIssuesQuery(queryResult, cursor))
    );
  };

  //update state when value of input change
  onChange = (event) => {
    this.setState({ path: event.target.value });
  };

  //fetch when submit
  onSubmit = (event) => {
    this.onFetchFromGithub(this.state.path);
    event.preventDefault();
  };

  //when called this function will go to data in state to get endCursor value.
  //then refetch by pass in endCursor onFetchFromGitHub.
  onFetchMoreIssues = () => {
    const { endCursor } = this.state.organization.repository.issues.pageInfo;
    this.onFetchFromGithub(this.state.path, endCursor);
  };

  render() {
    const { path, organization, error } = this.state;
    return (
      <div>
        <div>Graphql Github Client App</div>
        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">Show open issues for https://github.com/</label>
          <input
            id="url"
            type="text"
            onChange={this.onChange}
            style={{ width: "300px" }}
            value={path}
          />
          <button type="submit">Search</button>
        </form>
        <hr />
        {organization ? (
          <Organization
            organization={organization}
            errors={error}
            onFetchMoreIssues={this.onFetchMoreIssues}
          />
        ) : (
          <p>No information yet ... </p>
        )}
      </div>
    );
  }
}

//recieve organization and errors from state
const Organization = ({ organization, errors, onFetchMoreIssues }) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong: </strong>
        {errors.map((error) => error.message).join(" ")}
      </p>
    );
  }

  return (
    <div>
      <p>
        <strong>Issues from Organiation: </strong>
        <a href={organization.url}>{organization.name}</a>
        <Repository
          repository={organization.repository}
          onFetchMoreIssues={onFetchMoreIssues}
        />
      </p>
    </div>
  );
};

//recieve repository from Organization component to render a list of issues.
const Repository = ({ repository, onFetchMoreIssues }) => {
  return (
    <div>
      <p>
        <strong>In Repository: </strong>
        <a href={repository.url}>{repository.name}</a>
      </p>

      <ul>
        {repository.issues.edges.map((issue) => (
          <li key={issue.node.id}>
            <a href={issue.node.url}>{issue.node.title}</a>
            <ul>
              {issue.node.reactions.edges.map((reaction) => (
                <li key={reaction.node.id}>{reaction.node.content}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <hr />
      {repository.issues.pageInfo.hasNextPage && (
        <button onClick={onFetchMoreIssues}>More</button>
      )}
    </div>
  );
};

export default App;
