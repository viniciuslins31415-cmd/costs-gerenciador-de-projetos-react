import { v4 as uuidv4 } from 'uuid'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

import styles from './Project.module.css'

import Loading from '../layout/Loading'
import Container from '../layout/Container'
import ProjectForm from '../project/ProjectForm'
import Message from '../layout/Message'
import ServiceForm from '../service/ServiceForm'
import ServiceCard from '../service/ServiceCard'

function Project() {
  const { id } = useParams()

  const [project, setProject] = useState({})
  const [services, setServices] = useState([])
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState('success')

  useEffect(() => {
    fetch(`http://localhost:5000/projects/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((resp) => resp.json())
      .then((data) => {
        setProject(data)
        setServices(data.services || [])
      })
      .catch(() => {
        setMessage('Erro ao carregar projeto')
        setType('error')
      })
  }, [id])

  function editPost(updatedProject) {
    if (updatedProject.budget < updatedProject.cost) {
      setMessage('O Orçamento não pode ser menor que o custo do projeto!')
      setType('error')
      return
    }

    fetch(`http://localhost:5000/projects/${updatedProject.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedProject),
    })
      .then((resp) => resp.json())
      .then((data) => {
        setProject(data)
        setShowProjectForm(false)
        setMessage('Projeto atualizado!')
        setType('success')
      })
      .catch(() => {
        setMessage('Erro ao atualizar projeto')
        setType('error')
      })
  }

  function createService(service) {
  const serviceWithId = {
    ...service,
    id: uuidv4(),
  }

  const servicesUpdated = [...services, serviceWithId]

  const newCost =
    parseFloat(project.cost) + parseFloat(serviceWithId.cost)

  if (newCost > parseFloat(project.budget)) {
    setMessage('Orçamento ultrapassado, verifique o valor do serviço!')
    setType('error')
    return
  }

  const projectUpdated = {
    ...project,
    services: servicesUpdated,
    cost: newCost,
  }

  fetch(`http://localhost:5000/projects/${project.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectUpdated),
  })
    .then((resp) => resp.json())
    .then((data) => {
      setProject(data)
      setServices(data.services)
      setShowServiceForm(false)
      setMessage('Serviço adicionado!')
      setType('success')
    })
    .catch(() => {
      setMessage('Erro ao adicionar serviço')
      setType('error')
    })
}

  function removeService(serviceId, serviceCost) {
    const servicesUpdated = project.services.filter(
      (service) => service.id !== serviceId,
    )

    const projectUpdated = {
      ...project,
      services: servicesUpdated,
      cost: parseFloat(project.cost) - parseFloat(serviceCost),
    }

    fetch(`http://localhost:5000/projects/${projectUpdated.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectUpdated),
    })
      .then((resp) => resp.json())
      .then(() => {
        setProject(projectUpdated)
        setServices(servicesUpdated)
        setMessage('Serviço removido com sucesso!')
        setType('success')
      })
      .catch(() => {
        setMessage('Erro ao remover serviço')
        setType('error')
      })
  }

  return (
    <>
      {project.name ? (
        <div className={styles.project_details}>
          <Container customClass="column">
            {message && <Message type={type} msg={message} />}

            <div className={styles.details_container}>
              <h1>Projeto: {project.name}</h1>

              <button
                className={styles.btn}
                onClick={() => setShowProjectForm(!showProjectForm)}
              >
                {!showProjectForm ? 'Editar projeto' : 'Fechar'}
              </button>

              {!showProjectForm ? (
                <div className={styles.form}>
                  <p>
                    <span>Categoria:</span> {project.category?.name}
                  </p>
                  <p>
                    <span>Total do orçamento:</span> R${project.budget}
                  </p>
                  <p>
                    <span>Total utilizado:</span> R${project.cost}
                  </p>
                </div>
              ) : (
                <div className={styles.form}>
                  <ProjectForm
                    handleSubmit={editPost}
                    btnText="Concluir Edição"
                    projectData={project}
                  />
                </div>
              )}
            </div>

            <div className={styles.service_form_container}>
              <h2>Adicione um serviço:</h2>
              <button
                className={styles.btn}
                onClick={() => setShowServiceForm(!showServiceForm)}
              >
                {!showServiceForm ? 'Adicionar Serviço' : 'Fechar'}
              </button>

              {showServiceForm && (
                <div className={styles.form}>
                  <ServiceForm
                    handleSubmit={createService}
                    btnText="Adicionar Serviço"
                    projectData={project}
                  />
                </div>
              )}
            </div>

            <h2>Serviços:</h2>

            <Container customClass="start">
              {services.length > 0 ? (
                services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    id={service.id}
                    name={service.name}
                    cost={service.cost}
                    description={service.description}
                    handleRemove={removeService}
                  />
                ))
              ) : (
                <p>Não há serviços cadastrados.</p>
              )}
            </Container>
          </Container>
        </div>
      ) : (
        <Loading />
      )}
    </>
  )
}

export default Project
