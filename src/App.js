import React from "react";
import axios from "axios";

const axiosGithubGraphQL = axios.create({
  baseURL: "https://api.github.com/graphql",
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`,
  },
});

const GET_ORGANIZATION = `
{
  organization(login: "the-road-to-learn-react"){
    name
    url
  }
}
`;

class App extends React.Component {
  state = {
    path: "the-road-to-learn-react/the-road-to-learn-react",
    organization: null,
    error: null,
  };

  componentDidMount() {
    this.onFetchFromGithub();
  }

  onFetchFromGithub = () => {
    axiosGithubGraphQL
    .post('',{query: GET_ORGANIZATION})
    .then(result => this.setState(() => ({
      organization: result.data.data.organization,
      error: result.data.error,
    })),
    );
  }

  onChange = (event) => {
    this.setState({ path: event.target.value });
  };

  onSubmit = (event) => {
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
    </p>
  </div>
  )
}

export default App;
