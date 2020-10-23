import React from "react";
import axios from "axios";

const axiosGithubGraphQL = axios.create({
  baseURL: "https://api.github.com/graphql",
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`,
  },
});

const GET_ISSUES_OF_REPOSITORY =  `
query($organization: String!, $repository: String!){
  organization(login: $organization){
    name
    url
    repository(name:$repository){
      name
      url
      issues(last: 5){
        edges {
          node {
            id
            title
            url
          }
        }
      }
    }
  }
}
`;



const getIssueOfRepository = path => {
  const [organization, repository] = path.split('/')

  return axiosGithubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository},
  })
}

//HOC for this.setState in onFetchFromGithub
const resolveIssuesQuery = queryResult => () => ({
  organization: queryResult.data.data.organization,
  errors: queryResult.data.errors,
})

class App extends React.Component {
  state = {
    path: "facebook/create-react-app",
    organization: null,
    error: null,
  };

  componentDidMount() {
    this.onFetchFromGithub(this.state.path);
  }

  onFetchFromGithub = path => {
    getIssueOfRepository(path).then(queryResult => 
      this.setState(resolveIssuesQuery(queryResult))  
    )
  }

  onChange = (event) => {
    this.setState({ path: event.target.value });
  };

  onSubmit = (event) => {
    this.onFetchFromGithub(this.state.path);
    event.preventDefault();
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
        {organization ? (<Organization organization={organization} errors={error}/>) : (<p>No information yet ... </p>)}
      </div>
    );
  }
}

const Organization = ({organization, errors}) => {
  if(errors) {
    return(
      <p>
      <strong>Something went wrong: </strong>
      {errors.map(error => error.message).join(' ')}
    </p>
    )
  }

  return(
    <div>
    <p>
      <strong>Issues from Organiation: </strong>
      <a href={organization.url}>{organization.name}</a>
      <Repository repository={organization.repository}/>
    </p>
  </div>
  )
}

const Repository = ({repository}) => {

  return(
    <div>
      <p>
        <strong>In Repository: </strong>
        <a href={repository.url}>{repository.name}</a>
      </p>

      <ul>
        {repository.issues.edges.map(issue => (
          <li key={issue.node.id}>
            <a href={issue.node.url}>{issue.node.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App;
